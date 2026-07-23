import { CreateChildProfileScreen } from "@/src/features/childProfile/CreateChildProfileScreen";
import { useChildProfileFeatureFlags } from "@/src/features/childProfile/featureFlags";
import { Redirect } from "expo-router";
import { routes } from "@/src/navigation/routes";

export default function CreateChildProfileRoute() {
  const { createChildProfileUi } = useChildProfileFeatureFlags();
  if (!createChildProfileUi) {
    return <Redirect href={routes.sanctuary} />;
  }
  return <CreateChildProfileScreen />;
}
