import { expect, test } from "@playwright/test";

test.describe("authentication recovery flows", () => {
  test("reset password provides live match validation and visibility controls", async ({ page }) => {
    await page.goto("/reset-password?token=e2e-token");
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();

    const password = page.getByLabel("New password", { exact: true });
    const confirmation = page.getByLabel("Confirm new password", { exact: true });
    await password.fill("SecurePassword1!");
    await confirmation.fill("DifferentPassword1!");
    await expect(page.getByRole("status")).toContainText("Passwords do not match yet.");

    await confirmation.fill("SecurePassword1!");
    await expect(page.getByRole("status")).toContainText("Passwords match.");

    const showPassword = page.getByRole("button", { name: "Show password" });
    await showPassword.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();
  });

  test("verification page shows setup progress, resend guidance, and support FAQ", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4173" });
    await page.goto("/signup?verificationToken=e2e-token");
    await expect(page.getByText("Step 2 of 2: Verify Your Email")).toBeVisible();
    await expect(page.getByLabel("Account setup progress")).toBeVisible();
    await expect(page.getByText("Account", { exact: true })).toBeVisible();
    await expect(page.getByText("Verify", { exact: true })).toBeVisible();
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Resend Email" })).toBeDisabled();
    await page.getByLabel("Account email for resend").fill("e2e@example.com");
    await expect(page.getByRole("button", { name: "Resend Email" })).toBeEnabled();
    await expect(page.getByText("Troubleshooting FAQ")).toBeVisible();
    await page.getByText("Troubleshooting FAQ").click();
    await expect(page.getByText("Check spam:")).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact Support" })).toHaveAttribute("href", /mailto:support@thepatientscompass.com/);
    await expect(page.getByRole("button", { name: "Copy support email" })).toBeVisible();
    const acceptCookies = page.getByRole("button", { name: "Accept All" });
    if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
    await page.getByRole("button", { name: "Open verification help" }).click();
    await expect(page.getByRole("dialog", { name: "Verification help" })).toBeVisible();
    await expect(page.getByText("Need help finishing?")).toBeVisible();
    await page.getByLabel("Search verification help").fill("spam");
    await expect(page.getByText("Check your spam folder:")).toBeVisible();
    await expect(page.getByText("Request a fresh verification code:")).toBeHidden();
    await page.getByRole("listitem").first().click();
    await expect(page.getByText("Related Articles")).toBeVisible();
    await expect(page.locator("mark").filter({ hasText: "spam" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Request a fresh verification code" })).toHaveAttribute("title", /Confirm your email address/);
    await page.getByRole("button", { name: "Request a fresh verification code" }).dispatchEvent("touchstart");
    await expect(page.getByRole("tooltip")).toContainText("Confirm your email address");
    await expect(page.getByText("Preview", { exact: true })).toBeVisible();
    const previewTooltip = page.getByRole("tooltip");
    await previewTooltip.dispatchEvent("touchstart", { touches: [{ identifier: 1, clientX: 220, clientY: 420 }] });
    await previewTooltip.dispatchEvent("touchend", { changedTouches: [{ identifier: 1, clientX: 120, clientY: 420 }] });
    await expect(previewTooltip).toBeHidden();
    await expect(page.getByLabel("Filter help category")).toHaveValue("All topics");
    const firstArticle = page.getByRole("listitem").first();
    await firstArticle.focus();
    await expect(firstArticle).toBeFocused();
    await page.getByRole("button", { name: "Mark Check your spam folder not helpful" }).click();
    await expect(page.getByText("Thanks for your feedback.")).toBeVisible();
    await expect(page.getByPlaceholder("What could we improve? (optional)")).toBeVisible();
    await page.getByLabel("Improvement category", { exact: true }).selectOption({ label: "Instructions" });
    await expect(page.getByLabel("Improvement category", { exact: true })).toHaveValue("Instructions");
    await page.getByLabel("Improvement category", { exact: true }).selectOption({ label: "Other" });
    await expect(page.getByLabel("Custom improvement category")).toBeVisible();
    await page.getByLabel("Custom improvement category").fill("Verification wording");
    await page.getByLabel("Improvement category", { exact: true }).selectOption({ label: "Instructions" });
    await page.getByPlaceholder("What could we improve? (optional)").fill("The code instructions could be clearer.");
    await expect(page.getByPlaceholder("What could we improve? (optional)")).toHaveValue("The code instructions could be clearer.");
    await expect(page.getByText("39/240", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByText("Feedback submitted — thank you.")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByPlaceholder("What could we improve? (optional)")).toBeVisible();
    await page.getByRole("button", { name: "Send feedback" }).click();
    await expect(page.getByText("Feedback submitted — thank you.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" }).locator("span").last()).toHaveAttribute("style", /scaleX/);
    await page.getByRole("button", { name: "Back to search results" }).click();
    await expect(page.getByText("Related Articles")).toBeHidden();
    await page.getByRole("dialog", { name: "Verification help" }).getByRole("button", { name: "Close verification help" }).click();
    await expect(page.getByRole("dialog", { name: "Verification help" })).toBeHidden();
    await page.getByRole("button", { name: "Copy support email" }).click();
    await expect(page.getByText("Copied!", { exact: true })).toBeVisible();
  });
});

test("sign-in shows a recoverable OAuth failure popup", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("patients-compass-oauth-retry-count", "2"));
  await page.goto("/signin?reason=provider");
  await expect(page.getByRole("alertdialog", { name: "Sign-in error" })).toContainText("OAuth provider may be temporarily unavailable");
  await expect(page.getByLabel("Email for sign-in link")).toBeFocused();
  await page.getByLabel("Remember me on this device").check();
  await expect(page.getByLabel("Remember me on this device")).toBeChecked();
  await expect(page.getByText("Use an email sign-in link instead")).toBeVisible();
  await page.getByLabel("Email for sign-in link").fill("reader@example.com");
  const emailLinkButton = page.getByRole("button", { name: "Send email sign-in link" });
  await expect(emailLinkButton).toBeEnabled();
  await emailLinkButton.click();
  await expect(page.getByText("Email sent. Check your inbox.")).toBeVisible();
  await page.getByRole("button", { name: "Back to OAuth" }).click();
  await expect(page.getByRole("alertdialog", { name: "Sign-in error" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Continue with Patients Compass" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Patients Compass" }).first()).toBeFocused();
});


test("unknown routes render the branded 404 recovery page", async ({ page }) => {
  await page.goto("/does-not-exist");
  await expect(page.getByRole("heading", { name: "Let’s find a better path." })).toBeVisible();
  await expect(page.getByText("404 · Route unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Return home" })).toBeVisible();
});
