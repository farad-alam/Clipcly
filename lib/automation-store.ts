type AutomationState = {
    mediaBlob: Blob | null;
    mediaUrl: string | null;
    source: 'tiktok' | 'instagram' | null;
    meta: {
        description?: string;
        author?: string;
    } | null;
};

class AutomationStore {
    private state: AutomationState = {
        mediaBlob: null,
        mediaUrl: null,
        source: null,
        meta: null
    };

    setMedia(blob: Blob, meta: AutomationState['meta']) {
        this.state.mediaBlob = blob;
        // Accessing window/URL only on client
        if (typeof window !== 'undefined') {
            this.state.mediaUrl = URL.createObjectURL(blob);
        }
        this.state.source = 'tiktok';
        this.state.meta = meta;
    }

    getMedia() {
        return this.state;
    }

    clear() {
        if (this.state.mediaUrl && typeof window !== 'undefined') {
            URL.revokeObjectURL(this.state.mediaUrl);
        }
        this.state = {
            mediaBlob: null,
            mediaUrl: null,
            source: null,
            meta: null
        };
    }
}

export const automationStore = new AutomationStore();
