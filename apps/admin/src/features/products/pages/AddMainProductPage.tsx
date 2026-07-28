import { ProvisionalNotice } from "../components/ProvisionalNotice";

/**
 * Destination for the toolbar's "+ Add Main Products" button. The reference
 * shows the list only — no Add form frame exists yet (§4.6) — so this route is
 * registered to keep the screen's primary action from 404ing, and the form
 * lands in the round that gets a reference for it.
 */
export default function AddMainProductPage() {
  return (
    <ProvisionalNotice
      title="Add Main Products"
      description="Create a product, its variants and their prices."
    />
  );
}
