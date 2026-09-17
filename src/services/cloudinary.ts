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

interface CloudinaryResponse {
    secure_url?: string;
    public_id?: string;
    resource_type?: string;
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
    done?: boolean;
    error?: { message?: string };
}

type ProgressHandler = ((progress: number) => void) | null;

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// ============================================================
// IMAGE SETTINGS
// ============================================================

const MAX_IMAGE_OPTIMIZATION_SIZE = 9.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 3840;
const MIN_IMAGE_QUALITY = 0.70;
const START_IMAGE_QUALITY = 0.90;

// ============================================================
// VIDEO SETTINGS
// ============================================================

// No frontend maximum video size.
// Cloudinary account/plan controls the actual maximum.
const VIDEO_CHUNK_SIZE = 10 * 1024 * 1024;

// Retry failed chunks up to 3 times.
const MAX_CHUNK_RETRIES = 3;

// ============================================================
// HELPERS
// ============================================================

const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];

    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    const value = bytes / Math.pow(1024, index);

    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const createUploadId = (): string => {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID();
    }

    return `san-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 12)}`;
};

// ============================================================
// IMAGE OPTIMIZATION
// ============================================================

const createImageBlob = (
    image: HTMLImageElement,
    width: number,
    height: number,
    quality: number
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas');

            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d');

            if (!context) {
                reject(
                    new Error(
                        'Unable to process image context.'
                    )
                );
                return;
            }

            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';

            context.drawImage(
                image,
                0,
                0,
                width,
                height
            );

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(
                            new Error(
                                'Unable to optimize image.'
                            )
                        );
                        return;
                    }

                    resolve(blob);
                },
                'image/jpeg',
                quality
            );
        } catch (error) {
            reject(error);
        }
    });
};

export const optimizeImage = async (file: File): Promise<File> => {
    if (
        !file ||
        !file.type?.startsWith('image/')
    ) {
        return file;
    }

    // Small images are uploaded as-is.
    if (
        file.size <=
        MAX_IMAGE_OPTIMIZATION_SIZE
    ) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const image = new Image();

        const objectUrl =
            URL.createObjectURL(file);

        image.onload = async () => {
            try {
                URL.revokeObjectURL(objectUrl);

                let width = image.width;
                let height = image.height;

                // Limit extremely large dimensions.
                if (
                    width > MAX_IMAGE_DIMENSION ||
                    height > MAX_IMAGE_DIMENSION
                ) {
                    if (width > height) {
                        height = Math.round(
                            (height *
                                MAX_IMAGE_DIMENSION) /
                            width
                        );

                        width = MAX_IMAGE_DIMENSION;
                    } else {
                        width = Math.round(
                            (width *
                                MAX_IMAGE_DIMENSION) /
                            height
                        );

                        height = MAX_IMAGE_DIMENSION;
                    }
                }

                let quality =
                    START_IMAGE_QUALITY;

                let currentBlob =
                    await createImageBlob(
                        image,
                        width,
                        height,
                        quality
                    );

                // Reduce quality first.
                while (
                    currentBlob.size >
                    MAX_IMAGE_OPTIMIZATION_SIZE &&
                    quality > MIN_IMAGE_QUALITY
                ) {
                    quality -= 0.05;

                    currentBlob =
                        await createImageBlob(
                            image,
                            width,
                            height,
                            quality
                        );
                }

                // Then reduce dimensions.
                while (
                    currentBlob.size >
                    MAX_IMAGE_OPTIMIZATION_SIZE &&
                    width > 1600
                ) {
                    width = Math.round(
                        width * 0.88
                    );

                    height = Math.round(
                        height * 0.88
                    );

                    quality = Math.max(
                        quality,
                        MIN_IMAGE_QUALITY
                    );

                    currentBlob =
                        await createImageBlob(
                            image,
                            width,
                            height,
                            quality
                        );
                }

                const optimizedFile =
                    new File(
                        [currentBlob],
                        file.name.replace(
                            /\.[^/.]+$/,
                            '.jpg'
                        ),
                        {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        }
                    );

                resolve(optimizedFile);
            } catch (error: unknown) {
                reject(error);
            }
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);

            reject(
                new Error(
                    'Unable to read image. Please select a valid image.'
                )
            );
        };

        image.src = objectUrl;
    });
};

// ============================================================
// CLOUDINARY RESPONSE
// ============================================================

const parseCloudinaryResponse = (xhr: XMLHttpRequest): { response: CloudinaryResponse | null; message: string } => {
    let response: CloudinaryResponse | null = null;

    try {
        if (xhr.responseText) {
            const parsed: unknown = JSON.parse(xhr.responseText);
            if (parsed && typeof parsed === 'object') {
                response = parsed as CloudinaryResponse;
            }
        }
    } catch {
        response = null;
    }

    // Do not attempt to read the X-Cld-Error header, as it is not exposed via CORS.
    // Instead, rely on the JSON response body or the HTTP status text for error details.
    let message = response?.error?.message || xhr.statusText || `Cloudinary upload failed with status ${xhr.status}.`;

    // Provide clearer guidance when the error relates to file size limits.
    if (typeof message === 'string' && /file size too large|maximum is/i.test(message)) {
        message = `${message} Cloudinary's server-side maximum file size is being enforced. ` +
            `Chunking cannot bypass the account or upload-preset limit. ` +
            `Increase the Cloudinary video upload limit and check the upload preset's max_file_size, then retry.`;
    }

    return { response, message };
};

// ============================================================
// NORMAL IMAGE UPLOAD
// ============================================================

const uploadSingleRequest = (
    file: File,
    uploadUrl: string,
    folder: string,
    onProgress: ProgressHandler = null,
    progressStart = 0,
    progressEnd = 100
): Promise<CloudinaryResponse | null> => {
    return new Promise<CloudinaryResponse | null>(
        (resolve, reject) => {
            const xhr =
                new XMLHttpRequest();

            xhr.open(
                'POST',
                uploadUrl
            );

            xhr.upload.addEventListener(
                'progress',
                (event: ProgressEvent<EventTarget>) => {
                    if (
                        !event.lengthComputable ||
                        !onProgress
                    ) {
                        return;
                    }

                    const ratio =
                        event.loaded /
                        event.total;

                    const progress =
                        progressStart +
                        ratio *
                        (progressEnd -
                            progressStart);

                    onProgress(
                        Math.min(
                            Math.round(progress),
                            99
                        )
                    );
                }
            );

            xhr.addEventListener(
                'load',
                () => {
                    const {
                        response,
                        message,
                    } =
                        parseCloudinaryResponse(
                            xhr
                        );

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {
                        resolve(response);
                        return;
                    }

                    reject(
                        new Error(
                            `Cloudinary upload failed (${xhr.status}): ${message}`
                        )
                    );
                }
            );

            xhr.addEventListener(
                'error',
                () => {
                    reject(
                        new Error(
                            'Network error during upload to Cloudinary.'
                        )
                    );
                }
            );

            xhr.addEventListener(
                'abort',
                () => {
                    reject(
                        new Error(
                            'Cloudinary upload was cancelled.'
                        )
                    );
                }
            );

            xhr.addEventListener(
                'timeout',
                () => {
                    reject(
                        new Error(
                            'Cloudinary upload timed out. Please try again.'
                        )
                    );
                }
            );

            const formData =
                new FormData();

            formData.append(
                'file',
                file
            );

            formData.append(
                'upload_preset',
                UPLOAD_PRESET
            );

            formData.append(
                'folder',
                folder
            );

            xhr.send(formData);
        }
    );
};

// ============================================================
// SINGLE VIDEO CHUNK
// ============================================================

interface VideoChunkOptions {
    chunk: Blob;
    uploadUrl: string;
    folder: string;
    uploadId: string;
    start: number;
    end: number;
    total: number;
    uploadedBefore: number;
    onProgress: ProgressHandler;
    retryNumber?: number;
}

const uploadVideoChunk = ({
    chunk,
    uploadUrl,
    folder,
    uploadId,
    start,
    end,
    total,
    uploadedBefore,
    onProgress,
    retryNumber = 0,
}: VideoChunkOptions): Promise<CloudinaryResponse | null> => {
    return new Promise<CloudinaryResponse | null>(
        (resolve, reject) => {
            const xhr =
                new XMLHttpRequest();

            xhr.open(
                'POST',
                uploadUrl
            );

            // Cloudinary chunked upload headers.
            xhr.setRequestHeader(
                'X-Unique-Upload-Id',
                uploadId
            );

            xhr.setRequestHeader(
                'Content-Range',
                `bytes ${start}-${end}/${total}`
            );

            xhr.upload.addEventListener(
                'progress',
                (event: ProgressEvent<EventTarget>) => {
                    if (
                        !event.lengthComputable ||
                        !onProgress
                    ) {
                        return;
                    }

                    const currentUploaded =
                        uploadedBefore +
                        event.loaded;

                    const progress =
                        (currentUploaded /
                            total) *
                        100;

                    onProgress(
                        Math.min(
                            Math.round(progress),
                            99
                        )
                    );
                }
            );

            xhr.addEventListener(
                'load',
                () => {
                    const {
                        response,
                        message,
                    } =
                        parseCloudinaryResponse(
                            xhr
                        );

                    if (
                        xhr.status >= 200 &&
                        xhr.status < 300
                    ) {
                        resolve(response);
                        return;
                    }

                    reject(
                        new Error(
                            `Cloudinary chunk upload failed (${xhr.status}): ${message}`
                        )
                    );
                }
            );

            xhr.addEventListener(
                'error',
                () => {
                    reject(
                        new Error(
                            'Network error while uploading a video chunk.'
                        )
                    );
                }
            );

            xhr.addEventListener(
                'abort',
                () => {
                    reject(
                        new Error(
                            'Video chunk upload was cancelled.'
                        )
                    );
                }
            );

            xhr.addEventListener(
                'timeout',
                () => {
                    reject(
                        new Error(
                            'Video chunk upload timed out.'
                        )
                    );
                }
            );

            const formData =
                new FormData();

            formData.append(
                'file',
                chunk,
                'video-chunk'
            );

            formData.append(
                'upload_preset',
                UPLOAD_PRESET
            );

            formData.append(
                'folder',
                folder
            );

            xhr.send(formData);
        }
    ).catch(
        async (error: unknown) => {
            // Retry failed chunk.
            if (
                retryNumber <
                MAX_CHUNK_RETRIES
            ) {
                console.warn(
                    `Cloudinary chunk failed. Retrying ${retryNumber + 1}/${MAX_CHUNK_RETRIES}`,
                    error
                );

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            1000 *
                            (retryNumber + 1)
                        )
                );

                return uploadVideoChunk({
                    chunk,
                    uploadUrl,
                    folder,
                    uploadId,
                    start,
                    end,
                    total,
                    uploadedBefore,
                    onProgress,
                    retryNumber:
                        retryNumber + 1,
                });
            }

            throw error;
        }
    );
};

// ============================================================
// LARGE VIDEO CHUNKED UPLOAD
// ============================================================

const uploadVideoInChunks = async (
    file: File,
    uploadUrl: string,
    folder: string,
    onProgress: ProgressHandler = null
): Promise<CloudinaryResponse | null> => {
    const total = file.size;

    const uploadId =
        createUploadId();

    let uploadedBytes = 0;
    let finalResponse = null;

    console.log(
        '========================================'
    );

    console.log(
        'Cloudinary Chunked Video Upload'
    );

    console.log(
        `File: ${file.name}`
    );

    console.log(
        `Size: ${formatBytes(file.size)}`
    );

    console.log(
        `Chunk size: ${formatBytes(
            VIDEO_CHUNK_SIZE
        )}`
    );

    console.log(
        `Upload ID: ${uploadId}`
    );

    console.log(
        '========================================'
    );

    while (
        uploadedBytes < total
    ) {
        const start =
            uploadedBytes;

        const end = Math.min(
            start +
            VIDEO_CHUNK_SIZE -
            1,
            total - 1
        );

        const chunk =
            file.slice(
                start,
                end + 1
            );

        console.log(
            `Uploading chunk: ${formatBytes(
                start
            )} → ${formatBytes(end + 1)} / ${formatBytes(total)}`
        );

        const response =
            await uploadVideoChunk({
                chunk,
                uploadUrl,
                folder,
                uploadId,
                start,
                end,
                total,
                uploadedBefore:
                    uploadedBytes,
                onProgress,
            });

        uploadedBytes =
            end + 1;

        // Cloudinary may return the final response
        // when the last chunk is completed.
        if (
            response &&
            response.secure_url
        ) {
            finalResponse =
                response;
        }

        if (
            response &&
            response.done === true
        ) {
            finalResponse =
                response;
        }

        if (onProgress) {
            onProgress(
                Math.min(
                    Math.round(
                        (uploadedBytes /
                            total) *
                        100
                    ),
                    99
                )
            );
        }
    }

    console.log(
        'Cloudinary video upload completed.'
    );

    if (
        !finalResponse?.secure_url
    ) {
        throw new Error(
            'Cloudinary finished the upload but did not return a video URL.'
        );
    }

    return finalResponse;
};

// ============================================================
// MAIN UPLOAD FUNCTION
// ============================================================

export async function uploadToCloudinary(
    file: File,
    folder = 'san-photography',
    onProgress: ProgressHandler = null
): Promise<CloudinaryUploadResult> {
    if (!file) {
        throw new Error(
            'No file selected.'
        );
    }

    const isImage =
        file.type?.startsWith(
            'image/'
        );

    const isVideo =
        file.type?.startsWith(
            'video/'
        );

    if (!isImage && !isVideo) {
        throw new Error(
            'Only image and video files are allowed.'
        );
    }

    if (!CLOUD_NAME) {
        throw new Error(
            'Cloudinary cloud name is not configured. Check VITE_CLOUDINARY_CLOUD_NAME.'
        );
    }

    if (!UPLOAD_PRESET) {
        throw new Error(
            'Cloudinary upload preset is not configured. Check VITE_CLOUDINARY_UPLOAD_PRESET.'
        );
    }

    let uploadFile = file;

    try {
        // ========================================================
        // IMAGE
        // ========================================================

        if (isImage) {
            if (onProgress) {
                onProgress(5);
            }

            uploadFile =
                await optimizeImage(
                    file
                );

            if (onProgress) {
                onProgress(25);
            }
        }

        // ========================================================
        // CLOUDINARY URL
        // ========================================================

        const resourceType =
            isVideo
                ? 'video'
                : 'image';

        const uploadUrl =
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        let data: CloudinaryResponse | null = null;

        // ========================================================
        // VIDEO
        // ========================================================

        if (isVideo) {
            console.log(
                `Starting video upload: ${file.name}`
            );

            console.log(
                `Original video size: ${formatBytes(
                    file.size
                )}`
            );

            /*
             * There is NO JavaScript maximum video size here.
             *
             * The browser splits the video into 10 MB chunks.
             *
             * Cloudinary account/plan decides the actual maximum
             * file size that can ultimately be accepted.
             */

            if (onProgress) {
                onProgress(1);
            }

            data =
                await uploadVideoInChunks(
                    uploadFile,
                    uploadUrl,
                    folder,
                    onProgress
                );
        }

        // ========================================================
        // IMAGE
        // ========================================================

        if (isImage) {
            data =
                await uploadSingleRequest(
                    uploadFile,
                    uploadUrl,
                    folder,
                    onProgress,
                    25,
                    100
                );
        }

        // ========================================================
        // FINAL VALIDATION
        // ========================================================

        if (!data) {
            throw new Error(
                'Cloudinary did not return an upload response.'
            );
        }

        if (!data.secure_url) {
            throw new Error(
                'Cloudinary upload completed but no secure URL was returned.'
            );
        }

        if (onProgress) {
            onProgress(100);
        }

        return {
            url: data.secure_url,

            publicId:
                data.public_id || '',

            resourceType:
                data.resource_type ||
                resourceType,

            format:
                data.format || '',

            width:
                data.width || null,

            height:
                data.height || null,

            bytes:
                data.bytes ||
                uploadFile.size,

            originalSize:
                file.size,

            uploadedSize:
                uploadFile.size,
        };
    } catch (error: unknown) {
        console.error(
            'Cloudinary Upload Error:',
            error
        );

        const message = error instanceof Error
            ? error.message
            : 'Unable to upload file. Please try again.';

        // Preserve the original error as the cause for better debugging and to satisfy ESLint rule
        throw new Error(message, { cause: error });
    }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default uploadToCloudinary;