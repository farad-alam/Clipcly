
const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

if (!APP_ID || !APP_SECRET || !REDIRECT_URI) {
    console.error("Missing Instagram API Credentials in .env");
}

export class InstagramClient {
    static getLoginUrl() {
        // Scopes needed for publishing and reading basics
        const scopes = [
            "instagram_basic",
            "instagram_content_publish",
            "pages_show_list",
            "pages_read_engagement",
            "business_management", // Often needed to list pages
        ].join(",");

        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&state=st=${Math.random().toString(36).substring(7)}`; // Simple random state
    }

    static async getAccessToken(code: string) {
        const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${APP_SECRET}&code=${code}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.access_token;
    }

    static async getLongLivedToken(shortLivedToken: string) {
        const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.access_token;
    }

    static async getInstagramAccountId(accessToken: string) {
        // 1. Get User's Pages
        const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`;
        const pagesRes = await fetch(pagesUrl);
        const pagesData = await pagesRes.json();

        console.log("Pages Data Response:", JSON.stringify(pagesData, null, 2));

        if (pagesData.error) throw new Error(pagesData.error.message);

        // 2. Find a page with an Instagram Business Account connected
        for (const page of pagesData.data) {
            // Fetch specific page details to get IG ID
            const pageDetailsUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account,access_token&access_token=${accessToken}`;
            const detailRes = await fetch(pageDetailsUrl);
            const detailData = await detailRes.json();

            console.log(`Page Details for ${page.name} (${page.id}):`, JSON.stringify(detailData, null, 2));

            if (detailData.instagram_business_account) {
                return {
                    instagramId: detailData.instagram_business_account.id,
                    pageId: page.id,
                    username: page.name,
                    accessToken: accessToken
                };
            }
        }
        console.log("No Instagram Business Account found in any of the pages.");
        return null;
    }

    static async getInstagramUserDetails(instagramId: string, accessToken: string) {
        const url = `https://graph.facebook.com/v19.0/${instagramId}?fields=username,profile_picture_url&access_token=${accessToken}`;
        const res = await fetch(url);
        return await res.json();
    }

    static async publishImage(instagramId: string, imageUrl: string, caption: string, accessToken: string) {
        // 1. Create Container
        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
        const createRes = await fetch(createUrl, { method: 'POST' });
        const createData = await createRes.json();

        if (createData.error) throw new Error(createData.error.message);

        const creationId = createData.id;

        // 2. Publish Container
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();

        if (publishData.error) throw new Error(publishData.error.message);

        return publishData.id;
    }

    static async publishReel(instagramId: string, videoUrl: string, caption: string, accessToken: string) {
        // 1. Create Container for REELS
        // Note: media_type=REELS is required for reels
        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
        const createRes = await fetch(createUrl, { method: 'POST' });
        const createData = await createRes.json();

        if (createData.error) throw new Error(createData.error.message);

        const creationId = createData.id;

        // 2. Check Container Status (Video processing takes time)
        // For simplicity in this non-blocking implementation, we might just try to publish. 
        // But optimally we should poll. Instagram API usually requires waiting until status is FINISHED.
        // For this MVP, we will try to publish immediately, but if it fails, the user might see a failure.
        // A better approach for reels is usually to have a separate status check, but let's try the direct publish for now
        // or add a small delay.

        // Let's add a small polling mechanism here (blocking the server action for a bit)
        let status = 'IN_PROGRESS';
        let retries = 0;

        while (status !== 'FINISHED' && retries < 10) {
            await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
            const statusUrl = `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`;
            const statusRes = await fetch(statusUrl);
            const statusData = await statusRes.json();

            if (statusData.status_code) {
                status = statusData.status_code;
            }
            retries++;
        }

        if (status !== 'FINISHED') {
            throw new Error("Video processing timed out or failed");
        }

        // 3. Publish Container
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();

        if (publishData.error) throw new Error(publishData.error.message);

        return publishData.id;
    }
    static async publishStory(instagramId: string, mediaUrl: string, accessToken: string) {
        // 1. Create Container for STORIES
        // media_type=STORIES is required.
        // Stories do NOT support captions in the API (caption param is ignored or causes error if provided usually, but for consistency we just won't pass it).
        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?media_type=STORIES&image_url=${encodeURIComponent(mediaUrl)}&access_token=${accessToken}`;

        // Note: For Video Stories, we need video_url instead of image_url.
        // Let's check file extension or rely on caller to know which one, but simplest is to try to detect or have separate args?
        // Actually, for stories, it's safer to have strict types.
        // However, standard "media" endpoint with media_type=STORIES takes "image_url" for images and "video_url" for videos.
        // We will assume "url" is generic and try to detect or just send it as image_url if it looks like image, else video_url.
        // Or better: Let's make the signature accept "type": 'IMAGE' | 'VIDEO'

        // Revised implementation below to be robust:
    }

    static async publishStoryMedia(instagramId: string, mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO', accessToken: string) {
        let urlParam = '';
        if (mediaType === 'VIDEO') {
            urlParam = `video_url=${encodeURIComponent(mediaUrl)}`;
        } else {
            urlParam = `image_url=${encodeURIComponent(mediaUrl)}`;
        }

        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?media_type=STORIES&${urlParam}&access_token=${accessToken}`;
        const createRes = await fetch(createUrl, { method: 'POST' });
        const createData = await createRes.json();

        if (createData.error) throw new Error(createData.error.message);

        const creationId = createData.id;

        // 2. If Video, wait for processing
        if (mediaType === 'VIDEO') {
            let status = 'IN_PROGRESS';
            let retries = 0;

            while (status !== 'FINISHED' && retries < 10) {
                await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds
                const statusUrl = `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`;
                const statusRes = await fetch(statusUrl);
                const statusData = await statusRes.json();

                if (statusData.status_code) {
                    status = statusData.status_code;
                }
                retries++;
            }

            if (status !== 'FINISHED') {
                throw new Error("Story video processing timed out or failed");
            }
        }

        // 3. Publish Container
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();

        if (publishData.error) throw new Error(publishData.error.message);

        return publishData.id;
    }
}
