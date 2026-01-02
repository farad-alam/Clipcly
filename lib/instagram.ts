
const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

if (!APP_ID || !APP_SECRET || !REDIRECT_URI) {
    console.error("Missing Instagram API Credentials in .env");
}

export class InstagramClient {
    private static async safeFetch(url: string, options: RequestInit = {}) {
        try {
            const response = await fetch(url, options);
            const text = await response.text();

            try {
                const data = JSON.parse(text);
                if (data.error) {
                    console.error("Instagram API Error Object:", data.error);
                    throw new Error(data.error.message || "Instagram API Error");
                }
                return data;
            } catch (pE) {
                if (text.includes("error")) throw new Error(`API Error: ${text.substring(0, 100)}`);
                throw new Error("Invalid JSON response from Instagram");
            }
        } catch (e: any) {
            console.error("Instagram Network/API Error:", e.message);
            throw e;
        }
    }

    static getLoginUrl() {
        const scopes = [
            "instagram_basic",
            "instagram_content_publish",
            "pages_show_list",
            "pages_read_engagement",
            "business_management",
        ].join(",");

        return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&state=st=${Math.random().toString(36).substring(7)}`;
    }

    static async getAccessToken(code: string) {
        const url = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&client_secret=${APP_SECRET}&code=${code}`;
        const data = await this.safeFetch(url);
        return data.access_token;
    }

    static async getLongLivedToken(shortLivedToken: string) {
        const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`;
        const data = await this.safeFetch(url);
        return data.access_token;
    }

    static async getInstagramAccountId(accessToken: string) {
        try {
            // 1. Get User's Pages
            const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`;
            const pagesData = await this.safeFetch(pagesUrl);

            if (!pagesData.data || !Array.isArray(pagesData.data)) return null;

            // 2. Find a page with an Instagram Business Account connected
            for (const page of pagesData.data) {
                const pageDetailsUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account,access_token&access_token=${accessToken}`;
                const detailData = await this.safeFetch(pageDetailsUrl);

                if (detailData.instagram_business_account) {
                    return {
                        instagramId: detailData.instagram_business_account.id,
                        pageId: page.id,
                        username: page.name,
                        accessToken: accessToken
                    };
                }
            }
            return null;
        } catch (e) {
            console.error("getInstagramAccountId Fail:", e);
            return null;
        }
    }

    static async getInstagramUserDetails(instagramId: string, accessToken: string) {
        try {
            const url = `https://graph.facebook.com/v19.0/${instagramId}?fields=username,profile_picture_url&access_token=${accessToken}`;
            return await this.safeFetch(url);
        } catch (e) {
            return { username: "unknown", profile_picture_url: null };
        }
    }

    static async publishImage(instagramId: string, imageUrl: string, caption: string, accessToken: string) {
        // 1. Create Container
        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
        const createData = await this.safeFetch(createUrl, { method: 'POST' });
        const creationId = createData.id;

        // 2. Publish Container
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishData = await this.safeFetch(publishUrl, { method: 'POST' });
        return publishData.id;
    }

    static async publishReel(instagramId: string, videoUrl: string, caption: string, accessToken: string) {
        // 1. Create Container for REELS
        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
        const createData = await this.safeFetch(createUrl, { method: 'POST' });
        const creationId = createData.id;

        // 2. Polling
        let status = 'IN_PROGRESS';
        let retries = 0;

        while (status !== 'FINISHED' && retries < 15) { // Increased retries slightly for safety
            await new Promise(r => setTimeout(r, 4000)); // Wait 4 seconds
            try {
                const statusUrl = `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`;
                const statusData = await this.safeFetch(statusUrl);
                if (statusData.status_code) status = statusData.status_code;
                if (status === 'ERROR') throw new Error("Instagram flagged a processing error");
            } catch (e) {
                console.error("Polling error (will retry):", e);
            }
            retries++;
        }

        if (status !== 'FINISHED') throw new Error("Reel processing timed out or failed on Instagram side");

        // 3. Publish
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishData = await this.safeFetch(publishUrl, { method: 'POST' });
        return publishData.id;
    }

    static async publishStoryMedia(instagramId: string, mediaUrl: string, mediaType: 'IMAGE' | 'VIDEO', accessToken: string) {
        let urlParam = mediaType === 'VIDEO' ? `video_url=${encodeURIComponent(mediaUrl)}` : `image_url=${encodeURIComponent(mediaUrl)}`;
        const createUrl = `https://graph.facebook.com/v19.0/${instagramId}/media?media_type=STORIES&${urlParam}&access_token=${accessToken}`;

        const createData = await this.safeFetch(createUrl, { method: 'POST' });
        const creationId = createData.id;

        // 2. Processing (Stories also can take time check if video)
        if (mediaType === 'VIDEO') {
            let status = 'IN_PROGRESS';
            let retries = 0;
            while (status !== 'FINISHED' && retries < 15) {
                await new Promise(r => setTimeout(r, 4000));
                try {
                    const statusUrl = `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`;
                    const statusData = await this.safeFetch(statusUrl);
                    if (statusData.status_code) status = statusData.status_code;
                } catch (e) { }
                retries++;
            }
            if (status !== 'FINISHED') throw new Error("Story processing timeout");
        }

        // 3. Publish
        const publishUrl = `https://graph.facebook.com/v19.0/${instagramId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        const publishData = await this.safeFetch(publishUrl, { method: 'POST' });
        return publishData.id;
    }
}
