import { useEffect, useRef } from "react";

const SHOPIFY_SCRIPT_URL =
  "https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js";
const SHOPIFY_DOMAIN = "s064cx-hu.myshopify.com";
const SHOPIFY_STOREFRONT_TOKEN = "42fd9ba05585e4ba67d55bdb2af1e9f5";

let shopifySdkPromise: Promise<void> | null = null;

type ShopifyWindow = Window & {
  ShopifyBuy?: {
    buildClient: (config: {
      domain: string;
      storefrontAccessToken: string;
    }) => unknown;
    UI?: {
      onReady: (client: unknown) => Promise<{
        createComponent: (type: string, options: Record<string, unknown>) => void;
      }>;
    };
  };
};

function loadShopifyBuySdk() {
  const shopifyWindow = window as ShopifyWindow;
  if (shopifyWindow.ShopifyBuy?.UI) return Promise.resolve();
  if (shopifySdkPromise) return shopifySdkPromise;

  shopifySdkPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${SHOPIFY_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Shopify checkout could not load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = SHOPIFY_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Shopify checkout could not load."));
    document.head.appendChild(script);
  });

  return shopifySdkPromise;
}

type ShopifyProductEmbedProps = {
  productId: string;
  ariaLabel: string;
};

export default function ShopifyProductEmbed({ productId, ariaLabel }: ShopifyProductEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadShopifyBuySdk()
      .then(() => {
        const shopifyWindow = window as ShopifyWindow;
        const shopifyBuy = shopifyWindow.ShopifyBuy;
        const container = containerRef.current;
        if (cancelled || !shopifyBuy?.UI || !container) return;

        const client = shopifyBuy.buildClient({
          domain: SHOPIFY_DOMAIN,
          storefrontAccessToken: SHOPIFY_STOREFRONT_TOKEN,
        });

        return shopifyBuy.UI.onReady(client).then((ui) => {
          if (cancelled || !containerRef.current) return;

          containerRef.current.innerHTML = "";
          ui.createComponent("product", {
            id: productId,
            node: containerRef.current,
            moneyFormat: "%24%7B%7Bamount%7D%7D",
            options: {
              product: {
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      "max-width": "100%",
                      "margin-left": "0",
                      "margin-bottom": "50px",
                    },
                    "text-align": "left",
                  },
                  title: { "font-size": "26px" },
                  price: { "font-size": "18px" },
                  compareAt: { "font-size": "15.3px" },
                  unitPrice: { "font-size": "15.3px" },
                },
                layout: "horizontal",
                contents: {
                  img: false,
                  imgWithCarousel: true,
                  description: true,
                },
                width: "100%",
                text: { button: "Add to cart" },
              },
              productSet: {
                styles: {
                  products: {
                    "@media (min-width: 601px)": { "margin-left": "-20px" },
                  },
                },
              },
              modalProduct: {
                contents: {
                  img: false,
                  imgWithCarousel: true,
                  button: false,
                  buttonWithQuantity: true,
                },
                styles: {
                  product: {
                    "@media (min-width: 601px)": {
                      "max-width": "100%",
                      "margin-left": "0px",
                      "margin-bottom": "0px",
                    },
                  },
                  title: {
                    "font-family": "Helvetica Neue, sans-serif",
                    "font-weight": "bold",
                    "font-size": "26px",
                    color: "#4c4c4c",
                  },
                  price: {
                    "font-family": "Helvetica Neue, sans-serif",
                    "font-weight": "normal",
                    "font-size": "18px",
                    color: "#4c4c4c",
                  },
                  compareAt: {
                    "font-family": "Helvetica Neue, sans-serif",
                    "font-weight": "normal",
                    "font-size": "15.3px",
                    color: "#4c4c4c",
                  },
                  unitPrice: {
                    "font-family": "Helvetica Neue, sans-serif",
                    "font-weight": "normal",
                    "font-size": "15.3px",
                    color: "#4c4c4c",
                  },
                },
                text: { button: "Add to cart" },
              },
              option: {},
              cart: {
                text: {
                  total: "Subtotal",
                  button: "Checkout",
                },
              },
              toggle: {},
            },
          });
        });
      })
      .catch(() => {
        if (!cancelled && containerRef.current) {
          containerRef.current.textContent =
            "Shopify checkout is temporarily unavailable. Please try again shortly.";
          containerRef.current.className =
            "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700";
        }
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-[96px] w-full rounded-xl border border-[#EBE6DC] bg-white/70 p-2"
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-center gap-2 py-5 text-sm text-[#6A8571]" role="status">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#7E9A85]/30 border-t-[#7E9A85]" />
        Loading secure Shopify checkout…
      </div>
    </div>
  );
}
