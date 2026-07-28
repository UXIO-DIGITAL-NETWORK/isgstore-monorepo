import { ProvisionalNotice } from "../components/ProvisionalNotice";

/**
 * The second Product tab. Only its label exists in the reference — there is no
 * frame for the screen itself, so the route resolves and the tab bar matches
 * the design while the content waits (§4.6).
 */
export default function ProductProviderPage() {
  return (
    <ProvisionalNotice
      title="Product Provider"
      description="Which upstream supplier fulfils each product, and the template used to route its orders."
    />
  );
}
