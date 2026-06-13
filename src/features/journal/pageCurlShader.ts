/**
 * HP-style cylindrical page curl (SkSL) for the book page rect.
 * Page back uses warm parchment colour with fold shadow.
 */
export const PAGE_CURL_SKSL = `
uniform shader fromImg;
uniform shader toImg;
uniform float2 pageSize;
uniform float2 pageOffset;
uniform float progress;
uniform float topFlag;
uniform half3 pageBackColor;

const float MIN_AMOUNT = -0.26;
const float MAX_AMOUNT = 1.15;
const float PI = 3.141592653589793;
const float scale = 512.0;
const float sharpness = 3.0;

float2 mapUV(float2 uv) { return (topFlag < 0.5) ? float2(uv.x, 1.0 - uv.y) : uv; }
float2 geomUV(float2 uv) { return (topFlag < 0.5) ? float2(uv.x, 1.0 - uv.y) : uv; }

half4 getFromColor(float2 p) { return fromImg.eval(pageOffset + mapUV(p) * pageSize); }
half4 getToColor(float2 p) { return toImg.eval(pageOffset + mapUV(p) * pageSize); }

float3 hitPoint(float hitAngle, float yc, float3 point, float3x3 rrotation) {
  float hit = hitAngle / (2.0 * PI);
  point.y = hit;
  return float3(rrotation * point);
}

half4 antiAlias(half4 c1, half4 c2, float distanc) {
  distanc *= scale;
  if (distanc < 0.0) return c2;
  if (distanc > 2.0) return c1;
  float dd = pow(1.0 - distanc / 2.0, sharpness);
  return ((c2 - c1) * dd) + c1;
}

float distanceToEdge(float3 point) {
  float dx = abs(point.x > 0.5 ? 1.0 - point.x : point.x);
  float dy = abs(point.y > 0.5 ? 1.0 - point.y : point.y);
  if (point.x < 0.0) dx = -point.x;
  if (point.x > 1.0) dx = point.x - 1.0;
  if (point.y < 0.0) dy = -point.y;
  if (point.y > 1.0) dy = point.y - 1.0;
  if ((point.x < 0.0 || point.x > 1.0) && (point.y < 0.0 || point.y > 1.0)) {
    return sqrt(dx * dx + dy * dy);
  }
  return min(dx, dy);
}

half4 seeThrough(
  float yc,
  float2 p,
  float3x3 rotation,
  float3x3 rrotation,
  float cylinderAngle,
  float cylinderRadius
) {
  float hitAngle = PI - (acos(yc / cylinderRadius) - cylinderAngle);
  float3 point = hitPoint(hitAngle, yc, rotation * float3(p, 1.0), rrotation);
  if (yc <= 0.0 && (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0)) {
    return getToColor(p);
  }
  if (yc > 0.0) return getFromColor(p);
  half4 color = getFromColor(point.xy);
  return antiAlias(color, half4(0.0), distanceToEdge(point));
}

half4 seeThroughWithShadow(
  float yc,
  float2 p,
  float3 point,
  float3x3 rotation,
  float3x3 rrotation,
  float cylinderAngle,
  float cylinderRadius,
  float amount
) {
  float shadow = (1.0 - distanceToEdge(point) * 30.0) / 3.0;
  if (shadow < 0.0) shadow = 0.0;
  else shadow *= amount;
  half4 sc = seeThrough(yc, p, rotation, rrotation, cylinderAngle, cylinderRadius);
  sc.rgb -= shadow;
  return sc;
}

half4 backside(float yc, float3 point) {
  float curl = abs(yc / (1.0 / PI / 2.0));
  float foldShadow = pow(curl, 1.4) * 0.42;
  half3 warm = pageBackColor * (1.02 - foldShadow * 0.35);
  warm *= (1.0 - foldShadow * 0.55);
  return half4(warm, 1.0);
}

half4 behindSurface(
  float2 p,
  float yc,
  float3 point,
  float3x3 rrotation,
  float cylinderAngle,
  float cylinderRadius,
  float amount
) {
  float shado = (1.0 - ((-cylinderRadius - yc) / amount * 7.0)) / 6.0;
  shado *= 1.0 - abs(point.x - 0.5);
  yc = (-cylinderRadius - cylinderRadius - yc);
  float hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;
  point = hitPoint(hitAngle, yc, point, rrotation);
  if (
    yc < 0.0 &&
    point.x >= 0.0 &&
    point.y >= 0.0 &&
    point.x <= 1.0 &&
    point.y <= 1.0 &&
    (hitAngle < PI || amount > 0.5)
  ) {
    shado = 1.0 - (sqrt((point.x - 0.5) * (point.x - 0.5) + (point.y - 0.5) * (point.y - 0.5)) / 0.71);
    shado *= pow(-yc / cylinderRadius, 3.0) * 0.5;
  } else {
    shado = 0.0;
  }
  half3 base = getToColor(p).rgb;
  return half4(base - shado, 1.0);
}

half4 main(float2 xy) {
  float2 p = geomUV((xy - pageOffset) / pageSize);

  float amount = progress * (MAX_AMOUNT - MIN_AMOUNT) + MIN_AMOUNT;
  float cylinderCenter = amount;
  float cylinderAngle = 2.0 * PI * amount;
  float cylinderRadius = 1.0 / PI / 2.0;

  float angle = 100.0 * PI / 180.0;
  float c = cos(-angle);
  float s = sin(-angle);
  float3x3 rotation = float3x3(c, s, 0.0, -s, c, 0.0, -0.801, 0.8900, 1.0);
  c = cos(angle);
  s = sin(angle);
  float3x3 rrotation = float3x3(c, s, 0.0, -s, c, 0.0, 0.98500, 0.985, 1.0);

  float3 point = rotation * float3(p, 1.0);
  float yc = point.y - cylinderCenter;

  if (yc < -cylinderRadius) {
    return behindSurface(p, yc, point, rrotation, cylinderAngle, cylinderRadius, amount);
  }
  if (yc > cylinderRadius) {
    return getFromColor(p);
  }

  float hitAngle = (acos(yc / cylinderRadius) + cylinderAngle) - PI;
  float hitAngleMod = mod(hitAngle, 2.0 * PI);
  if ((hitAngleMod > PI && amount < 0.5) || (hitAngleMod > PI / 2.0 && amount < 0.0)) {
    return seeThrough(yc, p, rotation, rrotation, cylinderAngle, cylinderRadius);
  }

  point = hitPoint(hitAngle, yc, point, rrotation);
  if (point.x < 0.0 || point.y < 0.0 || point.x > 1.0 || point.y > 1.0) {
    return seeThroughWithShadow(
      yc,
      p,
      point,
      rotation,
      rrotation,
      cylinderAngle,
      cylinderRadius,
      amount
    );
  }

  half4 color = backside(yc, point);
  half3 foldShadow = pageBackColor * 0.55;
  half4 otherColor =
    yc < 0.0
      ? half4(
          foldShadow,
          (1.0 -
            (sqrt((point.x - 0.5) * (point.x - 0.5) + (point.y - 0.5) * (point.y - 0.5)) / 0.71)) *
            pow(-yc / cylinderRadius, 3.0) *
            0.5
        )
      : getFromColor(p);

  color = antiAlias(color, otherColor, cylinderRadius - abs(yc));
  half4 cl = seeThroughWithShadow(
    yc,
    p,
    point,
    rotation,
    rrotation,
    cylinderAngle,
    cylinderRadius,
    amount
  );
  float dist = distanceToEdge(point);
  return antiAlias(color, cl, dist);
}
`;

function hexToRgbNorm(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return [r, g, b];
}

export function pageBackColorUniform(hex: string) {
  const [r, g, b] = hexToRgbNorm(hex);
  return { pageBackColor: [r, g, b] as [number, number, number] };
}
