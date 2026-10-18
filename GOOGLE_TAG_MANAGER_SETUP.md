# Google Tag Manager and GA4 Activation

## Current Project Status

Patients Compass is configured with the Tag Manager container **`GTM-P74F4D5K`**. The website now waits until a visitor accepts analytics cookies before loading the standard Tag Manager container script. It sends only allowlisted `dataLayer` events, including `page_view`, `sign_up`, `feature_usage`, `purchase`, and selected non-sensitive interaction events. It deliberately excludes health questions, search text, biomarker data, lab content, account identifiers, names, email addresses, and payment details.

> A Tag Manager container ID (`GTM-...`) is not a Google Analytics Measurement ID (`G-...`). The GA4 Measurement ID is entered inside the Google tag configuration in Tag Manager; it does not need to be added to Patients Compass source code.

## Create the Google Tag

Open the **GTM-P74F4D5K** container in [Google Tag Manager](https://tagmanager.google.com/). Create a new **Google tag**, enter the GA4 web stream Measurement ID that begins with `G-`, and use the **Initialization – All Pages** trigger. The container itself is not requested until the visitor accepts analytics cookies, so no analytics tag runs before that consent action.

For the active Patients Compass setup, the Google tag uses a configuration settings variable with `send_page_view` set to `false`. The application then emits consent-gated, allowlisted route events through the data layer. Do not create any GTM variable or tag that reads user-generated text, health data, account details, or payment data.

| Project data-layer event | Suggested GTM trigger | Recommended GA4 event name |
| --- | --- | --- |
| `page_view` | Custom Event: `page_view` | `page_view` |
| `sign_up` | Custom Event: `sign_up` | `sign_up` |
| `purchase` | Custom Event: `purchase` | `purchase` |
| `feature_usage` | Custom Event: `feature_usage` | `feature_usage` |
| `header_search_feedback` | Custom Event: `header_search_feedback` | `header_search_feedback` |
| `referral_share` | Custom Event: `referral_share` | `referral_share` |

Do not create GTM variables or tags that read user-generated text, form values, chat content, lab reports, biomarkers, email addresses, profile fields, Stripe data, or local-storage history.

## Enable Preview and Debugging

In the Tag Manager workspace, click **Preview**, enter the published Patients Compass URL, and select **Connect**. Tag Assistant opens the site in a connected tab. Accept the analytics cookie banner, then navigate between pages and perform a safe interaction such as opening the dashboard or using a non-sensitive navigation control. Tag Assistant should display `gtm.js`, followed by `page_view` and any applicable interaction events. Google documents the Preview workflow and the event/data-layer inspection behavior in Tag Assistant. [1] [2]

If Preview does not connect, verify that the website uses the currently selected workspace, the container has not been blocked by a browser extension, the cookie banner was accepted, and the site URL uses the exact published host. The container cannot be debugged from the GTM ID alone; a workspace session in the owner’s Tag Manager account is required.

## Publish and Verify

After events appear correctly in Preview, click **Submit**, create a descriptive version name such as `Patients Compass consent-aware GA4`, and publish the container. Then use GA4 **Realtime** or **DebugView** to verify a page view from a test session. Event reporting can take longer than Tag Assistant Preview; Preview verifies the tag firing path before production reporting has finished processing. [1]

### Recorded Activation Evidence

The owner completed and shared the publication confirmation for **GTM-P74F4D5K** on **August 25, 2026 at 5:34 PM**. The published version contains the **GA4 — Patients Compass** Google tag and its Google Tag Configuration Settings variable. The owner also shared Tag Assistant verification showing both the GTM container and the GA4 Measurement ID **G-BQ7HJG0S8G** detected, with a **Page View** hit sent successfully. This is the durable project record of the external publication and pre-production verification.

## References

[1]: https://support.google.com/tagmanager/answer/6107056 "Google Tag Manager Help — Preview and debug containers"
[2]: https://developers.google.com/tag-platform/devguides/existing "Google Tag Platform — Analyze existing tag configurations"
