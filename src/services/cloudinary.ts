import { API_URL, buildApiUrl } from './api';

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
    resourceType: string;
    format: string;
    width: number | null;
    height: number | null;
    bytes: number;
    originalSize: number;
    uploadedSize: number;
}

type ProgressHandler = ((progress: number) => void) | null;

const API_BASE_URL = API_URL;
const CHUNK_SIZE = 10 * 1024 * 1024;
const CHUNK_RETRY_LIMIT = 3;
const MAX_VIDEO_SIZE = 2000 * 1024 * 1024;

const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
        Authorization: token ? `Bearer ${token}` : '',
    };
};

const buildUploadOptions = (formData: FormData, onProgress: ProgressHandler, method: 'POST' = 'POST') => {
    return new Promise<{ ok: boolean; status: number; payload: any }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, buildApiUrl(API_BASE_URL, 'api/media-api/upload.php'));
        const headers = getAuthHeaders();
        if (headers.Authorization) {
            xhr.setRequestHeader('Authorization', headers.Authorization);
        }

        xhr.upload.addEventListener('progress', (event) => {
            if (!event.lengthComputable || !onProgress) {
                return;
            }
            const progress = Math.min(Math.round((event.loaded / event.total) * 100), 99);
            onProgress(progress);
        });

        xhr.addEventListener('load', () => {
            let payload: any = null;
            try {
                payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
                payload = null;
            }
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, payload });
        });

        xhr.addEventListener('error', () => reject(new Error('Network error while uploading to the server.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));
        xhr.send(formData);
    });
};

const uploadChunkToServer = async (
    file: Blob,
    sessionId: string,
    chunkIndex: number,
    totalChunks: number,
    folder: string,
    category: string,
    filename: string,
    mimeType: string,
    totalSize: number,
    uploadedBefore: number,
    onProgress: ProgressHandler,
    highestProgress: { value: number }
): Promise<{ ok: boolean; status: number; payload: any }> => {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : `chunk-${chunkIndex}`);
    formData.append('session_id', sessionId);
    formData.append('chunk_index', String(chunkIndex));
    formData.append('total_chunks', String(totalChunks));
    formData.append('folder', folder);
    formData.append('category', category);
    formData.append('original_filename', filename);
    formData.append('mime_type', mimeType);
    formData.append('total_size', String(totalSize));

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', buildApiUrl(API_BASE_URL, 'api/media-api/upload-chunk.php'));
        const headers = getAuthHeaders();
        if (headers.Authorization) {
            xhr.setRequestHeader('Authorization', headers.Authorization);
        }

        xhr.upload.addEventListener('progress', (event) => {
            if (!event.lengthComputable || !onProgress) {
                return;
            }
            const progress = Math.min(
                Math.round(((uploadedBefore + event.loaded) / totalSize) * 100),
                99
            );
            highestProgress.value = Math.max(highestProgress.value, progress);
            onProgress(highestProgress.value);
        });

        xhr.addEventListener('load', () => {
            let payload: any = null;
            try {
                payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
                payload = null;
            }
            resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, payload });
        });
        xhr.addEventListener('error', () => reject(new Error('Network error while uploading a video chunk.')));
        xhr.addEventListener('abort', () => reject(new Error('Video chunk upload was cancelled.')));
        xhr.send(formData);
    });
};

const finalizeChunkUpload = async (sessionId: string, filename: string, folder: string, category: string, totalChunks: number): Promise<any> => {
    const formData = new FormData();
    formData.append('action', 'finalize');
    formData.append('session_id', sessionId);
    formData.append('filename', filename);
    formData.append('total_chunks', String(totalChunks));
    formData.append('folder', folder);
    formData.append('category', category);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildApiUrl(API_BASE_URL, 'api/media-api/upload-chunk.php'));
    const headers = getAuthHeaders();
    if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization);
    }

    return new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
            let payload: any = null;
            try {
                payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
                payload = null;
            }
            if (xhr.status >= 200 && xhr.status < 300 && payload?.success) {
                resolve(payload);
                return;
            }
            reject(new Error(payload?.message || 'Chunk upload finalization failed.'));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error while finalizing the upload.')));
        xhr.addEventListener('abort', () => reject(new Error('Upload finalization was cancelled.')));
        xhr.send(formData);
    });
};

export const optimizeImage = async (file: File): Promise<File> => {
    if (!file || !file.type?.startsWith('image/')) {
        return file;
    }

    if (file.size < 9 * 1024 * 1024) {
        return file;
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to read image file.'));
        };
        img.src = url;
    });

    const canvas = document.createElement('canvas');
    const maxDimension = 3840;
    let width = image.width;
    let height = image.height;

    if (width > maxDimension || height > maxDimension) {
        if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
        return file;
    }
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
            if (!result) {
                reject(new Error('Unable to optimize image.'));
                return;
            }
            resolve(result);
        }, 'image/jpeg', 0.82);
    });

    const optimizedFile = new File(
        [blob as BlobPart],
        file.name.replace(/\.[^/.]+$/, '.jpg'),
        { type: 'image/jpeg', lastModified: Date.now() }
    ) as File;

    return optimizedFile;
};

export async function uploadToCloudinary(
    file: File,
    folder = 'san-photography',
    onProgress: ProgressHandler = null
): Promise<CloudinaryUploadResult> {
    if (!file) {
        throw new Error('No file selected.');
    }

    const isImage = file.type?.startsWith('image/');
    const isVideo = file.type?.startsWith('video/');
    if (!isImage && !isVideo) {
        throw new Error('Only image and video files are allowed.');
    }

    const safeFolder = typeof folder === 'string' ? folder : 'san-photography';
    const category = safeFolder;
    const uploadFile = isImage ? await optimizeImage(file) : file;

    if (isVideo && uploadFile.size > CHUNK_SIZE) {
        if (uploadFile.size > MAX_VIDEO_SIZE) {
            throw new Error('Video exceeds the allowed 2 GB upload size.');
        }

        const totalChunks = Math.ceil(uploadFile.size / CHUNK_SIZE);
        const sessionId = crypto?.randomUUID?.() || `serverbyt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        let uploadedBefore = 0;
        const highestProgress = { value: 0 };

        for (let i = 0; i < totalChunks; i += 1) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, uploadFile.size);
            const chunk = uploadFile.slice(start, end);
            let response: { ok: boolean; status: number; payload: any } | null = null;
            let lastError: unknown = null;

            for (let attempt = 1; attempt <= CHUNK_RETRY_LIMIT; attempt += 1) {
                try {
                    response = await uploadChunkToServer(
                        chunk,
                        sessionId,
                        i,
                        totalChunks,
                        safeFolder,
                        category,
                        uploadFile.name,
                        uploadFile.type,
                        uploadFile.size,
                        uploadedBefore,
                        onProgress,
                        highestProgress
                    );

                    if (response.ok && response.payload?.success) {
                        break;
                    }
                } catch (error) {
                    lastError = error;
                }
            }

            if (!response?.ok || !response.payload?.success) {
                throw new Error(response?.payload?.message || (lastError instanceof Error ? lastError.message : `Chunk ${i + 1} failed after ${CHUNK_RETRY_LIMIT} attempts.`));
            }
            uploadedBefore = end;
        }

        const finalized = await finalizeChunkUpload(sessionId, uploadFile.name, safeFolder, category, totalChunks);
        const media = finalized?.media ?? finalized;
        if (!media?.url) {
            throw new Error('Server upload completed but no URL was returned.');
        }

        if (onProgress) {
            onProgress(100);
        }

        return {
            url: media.url,
            publicId: media.publicId || '',
            resourceType: media.resourceType || 'video',
            format: media.extension || '',
            width: media.width ?? null,
            height: media.height ?? null,
            bytes: Number(media.size || uploadFile.size),
            originalSize: file.size,
            uploadedSize: uploadFile.size,
        };
    }

    if (onProgress && isVideo) {
        onProgress(0);
    } else if (onProgress) {
        onProgress(5);
    }

    const formData = new FormData();
    formData.append('file', uploadFile, uploadFile.name);
    formData.append('folder', safeFolder);
    formData.append('category', category);

    const response = await buildUploadOptions(formData, onProgress, 'POST');
    if (!response.ok || !response.payload?.success) {
        throw new Error(
            response.payload?.message ||
            `Server upload failed (${response.status}).`
        );
    }

    const media = response.payload.media;
    if (!media?.url) {
        throw new Error('Server upload succeeded but no media URL was returned.');
    }

    if (onProgress) {
        onProgress(100);
    }

    return {
        url: media.url,
        publicId: media.publicId || '',
        resourceType: media.resourceType || (isImage ? 'image' : 'video'),
        format: media.extension || '',
        width: media.width ?? null,
        height: media.height ?? null,
        bytes: Number(media.size || uploadFile.size),
        originalSize: file.size,
        uploadedSize: uploadFile.size,
    };
}

export default uploadToCloudinary;