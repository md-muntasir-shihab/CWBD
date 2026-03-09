export type SignedUploadResponse = {
    provider: 's3' | 'local' | 'firebase';
    method: 'PUT' | 'POST';
    uploadUrl: string;
    publicUrl: string;
    headers?: Record<string, string>;
    fields?: Record<string, string>;
    expiresIn: number;
};
export declare function getSignedUploadForBanner(filename: string, mimeType: string): Promise<SignedUploadResponse>;
//# sourceMappingURL=uploadProvider.d.ts.map