import { Linking, Platform, Share, TurboModuleRegistry } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

export type ExportPromptResponse = string | number | string[];

export type ExportEntryData = {
  diaryEntryId?: string | null;
  lessonTitle: string;
  date: string;
  prompts: Array<{
    question: string;
    response: ExportPromptResponse;
  }>;
};

type ExpoPrintModule = {
  printToFileAsync: (options: {
    html?: string;
    width?: number;
    height?: number;
  }) => Promise<{ uri: string }>;
};

type ExpoSharingModule = {
  shareAsync: (
    url: string,
    options?: { mimeType?: string; dialogTitle?: string; UTI?: string },
  ) => Promise<void>;
};

function getPrintModule(): ExpoPrintModule | null {
  return requireOptionalNativeModule<ExpoPrintModule>("ExpoPrint");
}

function getSharingModule(): ExpoSharingModule | null {
  return requireOptionalNativeModule<ExpoSharingModule>("ExpoSharing");
}

export function isPrintNativeAvailable() {
  return getPrintModule()?.printToFileAsync != null;
}

export function isViewShotNativeAvailable() {
  return TurboModuleRegistry.get("RNViewShot") != null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatResponse(response: ExportPromptResponse) {
  if (Array.isArray(response)) return response.join(", ");
  return String(response);
}

export function buildTextExport(entryData: ExportEntryData) {
  const lines = [
    "Into the Pond",
    entryData.lessonTitle,
    entryData.date,
    "",
    ...entryData.prompts.flatMap((prompt) => [
      prompt.question,
      formatResponse(prompt.response),
      "",
    ]),
  ];
  return lines.join("\n").trim();
}

export function buildDiaryEntryHtml(entryData: ExportEntryData) {
  const promptsHtml = entryData.prompts
    .map(
      (prompt) => `
        <section class="prompt">
          <h2>${escapeHtml(prompt.question)}</h2>
          <p>${escapeHtml(formatResponse(prompt.response))}</p>
        </section>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            padding: 40px;
            background: #FAF7F2;
            color: #1F1A17;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
          .brand {
            color: #7A5C45;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          h1 {
            margin: 12px 0 4px;
            font-size: 34px;
            line-height: 1.1;
          }
          .date {
            color: #5B514A;
            font-size: 15px;
            margin-bottom: 28px;
          }
          .prompt {
            background: #FFFFFF;
            border: 1px solid #E8DDD3;
            border-radius: 18px;
            padding: 22px;
            margin-bottom: 18px;
          }
          .prompt h2 {
            margin: 0 0 12px;
            font-size: 20px;
            line-height: 1.25;
          }
          .prompt p {
            margin: 0;
            color: #5B514A;
            font-size: 16px;
            line-height: 1.5;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="brand">Into the Pond</div>
        <h1>${escapeHtml(entryData.lessonTitle)}</h1>
        <div class="date">${escapeHtml(entryData.date)}</div>
        ${promptsHtml}
      </body>
    </html>
  `;
}

export async function shareEntryText(entryData: ExportEntryData) {
  await Share.share({
    message: buildTextExport(entryData),
    title: "Share diary entry",
  });
}

function buildExportFilename(entryData: ExportEntryData) {
  const slug = entryData.lessonTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = entryData.diaryEntryId?.slice(0, 8) ?? String(Date.now());
  return `into-the-pond-${slug || "diary-entry"}-${suffix}.pdf`;
}

async function preparePdfForShare(pdfUri: string, entryData: ExportEntryData) {
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const destination = `${FileSystem.cacheDirectory}${buildExportFilename(entryData)}`;
    const info = await FileSystem.getInfoAsync(destination);
    if (info.exists) {
      await FileSystem.deleteAsync(destination, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: pdfUri, to: destination });
    return destination;
  } catch (error) {
    console.warn("[Export] Could not rename PDF, using original file", error);
    return pdfUri;
  }
}

async function sharePdfUri(pdfUri: string, entryData: ExportEntryData) {
  const shareUri = await preparePdfForShare(pdfUri, entryData);
  const Sharing = getSharingModule();

  if (Sharing?.shareAsync) {
    await Sharing.shareAsync(shareUri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: entryData.lessonTitle,
    });
    return;
  }

  await Share.share(
    Platform.OS === "ios"
      ? { url: shareUri, title: entryData.lessonTitle }
      : { message: buildTextExport(entryData), title: entryData.lessonTitle, url: shareUri },
  );
}

/** Try native PDF generation + share; always falls back to plain text share. */
export async function sharePdfOrText(entryData: ExportEntryData) {
  const Print = getPrintModule();
  if (Print?.printToFileAsync) {
    try {
      const result = await Print.printToFileAsync({ html: buildDiaryEntryHtml(entryData) });
      if (result.uri) {
        await sharePdfUri(result.uri, entryData);
        return;
      }
    } catch (error) {
      console.warn("[Export] PDF export unavailable, using text share", error);
    }
  }

  await shareEntryText(entryData);
}

export async function shareToInstagramStory(imageUri: string | null, entryData: ExportEntryData) {
  if (imageUri) {
    const url = `instagram-stories://share?backgroundImage=${encodeURIComponent(imageUri)}`;

    try {
      const canOpen = await Linking.canOpenURL("instagram-stories://share");
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch (error) {
      console.warn("[Export] Instagram story URL failed", error);
    }
  }

  await sharePdfOrText(entryData);
}

export async function shareToFacebookStory(imageUri: string | null, entryData: ExportEntryData) {
  if (imageUri) {
    const url = `fb://story_share?background_image=${encodeURIComponent(imageUri)}`;

    try {
      const canOpen = await Linking.canOpenURL("fb://story_share");
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch (error) {
      console.warn("[Export] Facebook story URL failed", error);
    }
  }

  await sharePdfOrText(entryData);
}
