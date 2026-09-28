import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  AlertCircle,
  Layers,
  Sparkles,
} from "lucide-react";

import { uploadToCloudinary, type CloudinaryUploadResult } from "../services/cloudinary";
import type { GalleryCouple, GalleryPhoto } from "../types";
import { API_URL } from "../services/api";

interface GalleryAdminAlbum extends GalleryCouple {
  id: string;
  slug: string;
  name: string;
  location: string;
  image: string;
  order: number;
  photoCount?: number;
}

interface GalleryHeader {
  heroEyebrow: string;
  heroHeadingLine1: string;
  heroHeadingLine2: string;
  heroDescription: string;
  ctaEyebrow: string;
  ctaHeadingLine1: string;
  ctaHeadingLine2: string;
  ctaDescription: string;
  ctaButtonText: string;
  ctaButtonHref: string;
}

interface AdminGalleryPhoto extends GalleryPhoto {
  id: string;
  imageUrl: string;
  order?: number;
  publicId?: string;
  title?: string;
}

type QueuedPhotoStatus = "queued" | "uploading" | "saving" | "failed" | "uploaded";

interface QueuedPhoto {
  id: string;
  file: File;
  status: QueuedPhotoStatus;
  progress: number;
  error?: string;
  media?: CloudinaryUploadResult;
}

interface RejectedPhoto {
  fileName: string;
  message: string;
}

type GallerySection = "wedding" | "engagement" | "preWedding";

const GALLERY_SECTIONS: GallerySection[] = ["wedding", "engagement", "preWedding"];
const GALLERY_SECTION_LABELS: Record<GallerySection, string> = {
  wedding: "Wedding",
  engagement: "Engagement",
  preWedding: "Pre Wedding",
};
const GALLERY_MEDIA_PREFIXES: Record<GallerySection, string> = {
  wedding: "gallery",
  engagement: "recent",
  preWedding: "pre-wedding",
};
const getMediaCategory = (section: GallerySection, slug: string) => `${GALLERY_MEDIA_PREFIXES[section]}:${slug}`;
const getMediaFolder = (section: GallerySection, slug: string) =>
  `san-photography/gallery/${section === "engagement" ? "recent" : section === "preWedding" ? "pre-wedding" : slug}`;

interface GalleryApiResponse {
  success?: boolean;
  message?: string;
  content?: { gallery?: Partial<GalleryHeader> & { wedding?: unknown; engagement?: unknown; preWedding?: unknown; couples?: unknown; recentAlbums?: unknown }; [key: string]: unknown };
  gallery?: { albums?: unknown; wedding?: unknown; engagement?: unknown; preWedding?: unknown; header?: Partial<GalleryHeader>; album?: GalleryAdminAlbum; recentBySlug?: Record<string, AdminGalleryPhoto[]>; bySlug?: Record<string, AdminGalleryPhoto[]> };
  galleryBySlug?: Record<string, AdminGalleryPhoto[]>;
  photos?: AdminGalleryPhoto[];
  album?: GalleryAdminAlbum;
  [key: string]: unknown;
}

const API_BASE_URL = API_URL;

const MAX_CARDS = 28;
const MAX_PHOTOS = 50;
const MAX_ALBUMS_BY_SECTION: Record<GallerySection, number> = {
  wedding: 12,
  engagement: 8,
  preWedding: 8,
};
const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
const MAX_CONCURRENT_PHOTO_UPLOADS = 3;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function getPhotoFileError(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const expectedType = extension === "jpg" || extension === "jpeg"
    ? "image/jpeg"
    : extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "";

  if (!ALLOWED_PHOTO_EXTENSIONS.has(extension) || !ALLOWED_PHOTO_TYPES.has(file.type) || file.type !== expectedType) {
    return "Invalid image type. Use JPG, JPEG, PNG, or WEBP.";
  }
  if (file.size <= 0) return "The file is empty.";
  if (file.size > MAX_IMAGE_SIZE) return "File size exceeds the 25 MiB limit.";
  return null;
}

function QueuedPhotoPreview({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return previewUrl ? <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" /> : null;
}

const DEFAULT_WEDDING_ALBUMS: GalleryAdminAlbum[] = [
  {
    id: "1",
    slug: "kapil-payal",
    name: "Kapil & Payal",
    location: "Udaipur, Rajasthan",
    image: "",
    order: 0,
  },
  {
    id: "2",
    slug: "pratik-megha",
    name: "Pratik & Megha",
    location: "Goa, India",
    image: "",
    order: 1,
  },
  {
    id: "3",
    slug: "tanmay-achal",
    name: "Tanmay & Achal",
    location: "Jaipur, Rajasthan",
    image: "",
    order: 2,
  },
];

const DEFAULT_ENGAGEMENT_ALBUMS: GalleryAdminAlbum[] = [];
const DEFAULT_PRE_WEDDING_ALBUMS: GalleryAdminAlbum[] = [];

const DEFAULT_HEADER: GalleryHeader = {
  heroEyebrow: "SAN / GALLERY",
  heroHeadingLine1: "Stories in",
  heroHeadingLine2: "Frames.",
  heroDescription:
    "A visual diary of timeless moments. Browse through our collection of iconic wedding frames, raw emotions, and beautiful details that capture the essence of every celebration.",
  ctaEyebrow: "SAN Photography",
  ctaHeadingLine1: "Your story.",
  ctaHeadingLine2: "Our frame.",
  ctaDescription:
    "Every celebration has a story. We are here to preserve yours beautifully.",
  ctaButtonText: "Start Your Story",
  ctaButtonHref: "/contact",
};

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getToken = () =>
  localStorage.getItem("adminToken") || "";

const getFileTitle = (file: File | undefined) =>
  file?.name?.replace(/\.[^/.]+$/, "") ||
  "Untitled Photo";

const createSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseApiResponse = async (response: Response): Promise<GalleryApiResponse> => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an invalid response (${response.status}). Please check the PHP API/server console.`
    );
  }
};

const normalizeAlbum = (album: Partial<GalleryAdminAlbum>, index: number): GalleryAdminAlbum => ({
  id: String(album?.id || `album-${Date.now()}-${index}`),
  slug: createSlug(
    album?.slug || `album-${index + 1}`
  ),
  name:
    album?.name?.trim() ||
    "Untitled Album",
  location:
    album?.location?.trim() || "",
  image:
    album?.image || "",
  order:
    typeof album?.order === "number"
      ? album.order
      : index,
  photoCount:
    typeof album?.photoCount === "number"
      ? album.photoCount
      : undefined,
});

const normalizeAlbums = (items: unknown): GalleryAdminAlbum[] =>
  Array.isArray(items)
    ? items
        .map(normalizeAlbum)
        .sort(
          (a, b) =>
            Number(a.order) - Number(b.order)
        )
        .map((album, index) => ({
          ...album,
          order: index,
        }))
    : [];

export default function GalleryManagement() {
  /* =========================================================
     HEADER
  ========================================================= */

  const [header, setHeader] = useState<GalleryHeader>(DEFAULT_HEADER);

  const [originalHeader, setOriginalHeader] = useState<GalleryHeader>(DEFAULT_HEADER);

  /* =========================================================
    WEDDING ALBUMS
  ========================================================= */

  const [albumsBySection, setAlbumsBySection] = useState<Record<GallerySection, GalleryAdminAlbum[]>>({
    wedding: DEFAULT_WEDDING_ALBUMS,
    engagement: DEFAULT_ENGAGEMENT_ALBUMS,
    preWedding: DEFAULT_PRE_WEDDING_ALBUMS,
  });
  const [originalAlbumsBySection, setOriginalAlbumsBySection] = useState<Record<GallerySection, GalleryAdminAlbum[]>>({
    wedding: DEFAULT_WEDDING_ALBUMS,
    engagement: DEFAULT_ENGAGEMENT_ALBUMS,
    preWedding: DEFAULT_PRE_WEDDING_ALBUMS,
  });

  /* =========================================================
     MEDIA STATE
  ========================================================= */

  // {
  //   [slug]: Photo[]
  // }
  const [photosBySection, setPhotosBySection] = useState<Record<GallerySection, Record<string, AdminGalleryPhoto[]>>>({
    wedding: {},
    engagement: {},
    preWedding: {},
  });
  const [loadingPhotosBySection, setLoadingPhotosBySection] = useState<Record<GallerySection, Record<string, boolean>>>({
    wedding: {},
    engagement: {},
    preWedding: {},
  });

  const [expandedAlbumKey, setExpandedAlbumKey] = useState<string | null>(null);

  /* =========================================================
     UI STATE
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saveMsg, setSaveMsg] =
    useState("");

  const [errMsg, setErrMsg] =
    useState("");

  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [photoQueues, setPhotoQueues] = useState<Record<string, QueuedPhoto[]>>({});
  const [rejectedPhotos, setRejectedPhotos] = useState<Record<string, RejectedPhoto[]>>({});
  const activePhotoQueueKeysRef = useRef(new Set<string>());

  /* =========================================================
     ADD ALBUM STATE
  ========================================================= */

  const [newAlbum, setNewAlbum] = useState<Pick<GalleryAdminAlbum, "name" | "slug" | "location" | "image">>({
      name: "",
      slug: "",
      location: "",
      image: "",
    });

  const [newAlbumSection, setNewAlbumSection] = useState<GallerySection>("wedding");

  const [showAddAlbum, setShowAddAlbum] =
    useState(false);

  /* =========================================================
     CARD COUNT
  ========================================================= */

  const totalCards = GALLERY_SECTIONS.reduce(
    (total, section) => total + albumsBySection[section].length,
    0
  );

  const remainingCards =
    Math.max(0, MAX_CARDS - totalCards);

  /* =========================================================
     CHANGE DETECTION
  ========================================================= */

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(header) !==
        JSON.stringify(originalHeader) ||
      JSON.stringify(albumsBySection) !==
        JSON.stringify(originalAlbumsBySection)
    );
  }, [
    header,
    originalHeader,
    albumsBySection,
    originalAlbumsBySection,
  ]);

  /* =========================================================
     API HEADERS
  ========================================================= */

  const authenticatedHeaders = () => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const authenticatedJsonHeaders = () => ({
    "Content-Type": "application/json",
    ...authenticatedHeaders(),
  });

  const getSectionAlbums = (section: GallerySection) => albumsBySection[section];
  const isAtAlbumLimit = (section: GallerySection) =>
    getSectionAlbums(section).length >= MAX_ALBUMS_BY_SECTION[section];

  const updateSectionAlbums = (
    section: GallerySection,
    update: (albums: GalleryAdminAlbum[]) => GalleryAdminAlbum[]
  ) => {
    setAlbumsBySection((previous) => ({
      ...previous,
      [section]: update(previous[section]),
    }));
  };

  const updateSectionPhotos = (
    section: GallerySection,
    update: (photos: Record<string, AdminGalleryPhoto[]>) => Record<string, AdminGalleryPhoto[]>
  ) => {
    setPhotosBySection((previous) => ({
      ...previous,
      [section]: update(previous[section]),
    }));
  };

  const updateSectionLoading = (section: GallerySection, slug: string, isLoading: boolean) => {
    setLoadingPhotosBySection((previous) => ({
      ...previous,
      [section]: { ...previous[section], [slug]: isLoading },
    }));
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrMsg("");

      /* -----------------------------------------------------
         CONTENT / METADATA
      ----------------------------------------------------- */

      const contentRes = await fetch(
        `${API_BASE_URL}/api/content.php`,
        { cache: "no-store" }
      );

      const contentData =
        await parseApiResponse(contentRes);

      if (
        !contentRes.ok ||
        !contentData.success
      ) {
        throw new Error(
          contentData.message ||
            "Failed to load Gallery content."
        );
      }

      const gallery =
        contentData.content?.gallery || {};

      const loadedHeader = {
        heroEyebrow:
          gallery.heroEyebrow ??
          DEFAULT_HEADER.heroEyebrow,

        heroHeadingLine1:
          gallery.heroHeadingLine1 ??
          DEFAULT_HEADER.heroHeadingLine1,

        heroHeadingLine2:
          gallery.heroHeadingLine2 ??
          DEFAULT_HEADER.heroHeadingLine2,

        heroDescription:
          gallery.heroDescription ??
          DEFAULT_HEADER.heroDescription,

        ctaEyebrow:
          gallery.ctaEyebrow ??
          DEFAULT_HEADER.ctaEyebrow,

        ctaHeadingLine1:
          gallery.ctaHeadingLine1 ??
          DEFAULT_HEADER.ctaHeadingLine1,

        ctaHeadingLine2:
          gallery.ctaHeadingLine2 ??
          DEFAULT_HEADER.ctaHeadingLine2,

        ctaDescription:
          gallery.ctaDescription ??
          DEFAULT_HEADER.ctaDescription,

        ctaButtonText:
          gallery.ctaButtonText ??
          DEFAULT_HEADER.ctaButtonText,

        ctaButtonHref:
          gallery.ctaButtonHref ??
          DEFAULT_HEADER.ctaButtonHref,
      };

      const loadedAlbumsBySection: Record<GallerySection, GalleryAdminAlbum[]> = {
        wedding: normalizeAlbums(gallery.wedding ?? gallery.couples),
        engagement: normalizeAlbums(gallery.engagement ?? gallery.recentAlbums),
        preWedding: normalizeAlbums(gallery.preWedding),
      };

      setHeader(loadedHeader);
      setOriginalHeader(
        deepClone(loadedHeader)
      );

      setAlbumsBySection(loadedAlbumsBySection);
      setOriginalAlbumsBySection(deepClone(loadedAlbumsBySection));

      /* -----------------------------------------------------
         GALLERY MEDIA
      ----------------------------------------------------- */

      const galleryRes = await fetch(
        `${API_BASE_URL}/api/gallery.php?include_inactive=1&include_media=0`,
        { cache: "no-store" }
      );

      const galleryData =
        await parseApiResponse(
          galleryRes
        );

      if (
        !galleryRes.ok ||
        !galleryData.success
      ) {
        throw new Error(
          galleryData.message ||
            "Failed to load gallery media."
        );
      }

      /*
      * galleryBySlug retains existing Wedding media keys.
       */

      setPhotosBySection({ wedding: {}, engagement: {}, preWedding: {} });
    } catch (error: unknown) {
      console.error(
        "Gallery load error:",
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to load Gallery."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =========================================================
     FETCH ALBUM PHOTOS
  ========================================================= */

  const fetchAlbumPhotos = async (
    slug: string,
    section: GallerySection = "wedding"
  ) => {
    if (!slug) return;

    try {
      updateSectionLoading(section, slug, true);

      const response = await fetch(
        `${API_BASE_URL}/api/gallery.php?slug=${encodeURIComponent(
          slug
        )}&section=${encodeURIComponent(section)}`,
        { cache: "no-store" }
      );

      const data =
        await parseApiResponse(response);

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            `Failed to load ${slug} photos.`
        );
      }

      const photos =
        Array.isArray(data.photos)
          ? data.photos
          : [];

      updateSectionPhotos(section, (previous) => ({ ...previous, [slug]: photos }));
    } catch (error: unknown) {
      console.error(
        `Failed to load photos for ${slug}:`,
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to load album photos."
      );
    } finally {
      updateSectionLoading(section, slug, false);
    }
  };

  /* =========================================================
     EXPAND / COLLAPSE
  ========================================================= */

  const toggleAlbum = async (
    slug: string,
    section: GallerySection
  ) => {
    const key =
      `${section}:${slug}`;

    if (
      expandedAlbumKey === key
    ) {
      setExpandedAlbumKey(null);
      return;
    }

    setExpandedAlbumKey(key);

    await fetchAlbumPhotos(
      slug,
      section
    );
  };

  /* =========================================================
     ADD ALBUM
  ========================================================= */

  const openAddAlbum = (section: GallerySection) => {
    if (isAtAlbumLimit(section)) {
      alert(`Maximum ${MAX_ALBUMS_BY_SECTION[section]} ${GALLERY_SECTION_LABELS[section]} albums are allowed.`);
      return;
    }

    if (totalCards >= MAX_CARDS) {
      alert(
        `Maximum ${MAX_CARDS} albums are allowed across all gallery categories.`
      );
      return;
    }

    setNewAlbumSection(section);

    setNewAlbum({
      name: "",
      slug: "",
      location: "",
      image: "",
    });

    setShowAddAlbum(true);
  };

  const handleAddAlbum = () => {
    if (isAtAlbumLimit(newAlbumSection)) {
      alert(`Maximum ${MAX_ALBUMS_BY_SECTION[newAlbumSection]} ${GALLERY_SECTION_LABELS[newAlbumSection]} albums are allowed.`);
      return;
    }

    if (totalCards >= MAX_CARDS) {
      alert(
        `Maximum ${MAX_CARDS} cards are allowed in total.`
      );
      return;
    }

    const name =
      newAlbum.name.trim();

    if (!name) {
      alert(
        "Please enter an Album Name."
      );
      return;
    }

    const generatedSlug =
      createSlug(
        newAlbum.slug ||
          name
      );

    if (!generatedSlug) {
      alert(
        "Please enter a valid album slug."
      );
      return;
    }

    const allAlbums = GALLERY_SECTIONS.flatMap((section) => getSectionAlbums(section));

    const duplicate =
      allAlbums.some(
        (album) =>
          album.slug.toLowerCase() ===
          generatedSlug.toLowerCase()
      );

    if (duplicate) {
      alert(
          "An album with this slug already exists. Slugs must be unique across all gallery categories."
      );
      return;
    }

    const targetList = getSectionAlbums(newAlbumSection);

    const created = {
      id: `album-${Date.now()}`,
      slug: generatedSlug,
      name,
      location:
        newAlbum.location.trim(),
      image:
        newAlbum.image || "",
      order: targetList.length,
      photoCount: 0,
    };

    updateSectionPhotos(newAlbumSection, (previous) => ({ ...previous, [generatedSlug]: [] }));
    updateSectionAlbums(newAlbumSection, (previous) => [...previous, created]);

    setNewAlbum({
      name: "",
      slug: "",
      location: "",
      image: "",
    });

    setShowAddAlbum(false);
    setSaveMsg("");
  };

  /* =========================================================
     UPDATE ALBUM
  ========================================================= */

  const handleUpdateAlbum = (
    section: GallerySection,
    index: number,
    field: keyof GalleryAdminAlbum,
    value: string
  ) => {
    updateSectionAlbums(section, (previous) => {
      const updated = [...previous];
      updated[index] = {
        ...updated[index],
        [field]: field === "slug" ? createSlug(value) : value,
      };
      return updated;
    });

    setSaveMsg("");
  };

  /* =========================================================
     MOVE ALBUM
  ========================================================= */

  const handleMoveAlbum = (
    section: GallerySection,
    index: number,
    direction: number
  ) => {
    const source = getSectionAlbums(section);

    const target =
      index + direction;

    if (
      target < 0 ||
      target >= source.length
    ) {
      return;
    }

    const reordered = [
      ...source,
    ];

    const temp =
      reordered[index];

    reordered[index] =
      reordered[target];

    reordered[target] =
      temp;

    const normalized =
      reordered.map(
        (album, i) => ({
          ...album,
          order: i,
        })
      );

    updateSectionAlbums(section, () => normalized);

    setSaveMsg("");
  };

  /* =========================================================
     UPLOAD COVER
  ========================================================= */

  const handleUploadAlbumCover = async (
    section: GallerySection,
    index: number,
    file: File | undefined
  ) => {
    if (!file) return;

    const key =
      `cover-${section}-${index}`;

    try {
      setUploadingState(
        (prev) => ({
          ...prev,
          [key]: true,
        })
      );

      setErrMsg("");

      const result =
        await uploadToCloudinary(
          file,
          `san-photography/gallery/covers`
        );

      if (!result?.url) {
        throw new Error(
          "Cloudinary did not return an image URL."
        );
      }

      handleUpdateAlbum(
        section,
        index,
        "image",
        result.url
      );

      setSaveMsg(
        "Cover uploaded. Click Save Changes to persist it."
      );
    } catch (error: unknown) {
      console.error(
        "Cover upload error:",
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to upload cover."
      );
    } finally {
      setUploadingState(
        (prev) => ({
          ...prev,
          [key]: false,
        })
      );
    }
  };

  /* =========================================================
     DELETE ALBUM
  ========================================================= */

  const handleDeleteAlbum = async (
    section: GallerySection,
    index: number
  ) => {
    const source = getSectionAlbums(section);

    const album =
      source[index];

    if (!album) return;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${album.name}"?\n\nThis will permanently delete the album and all photos inside it.`
      );

    if (!confirmed) return;

    try {
      setErrMsg("");

      /*
       * If this album already exists in DB,
       * delete it from DB.
       *
       * For a newly-created unsaved album,
       * there may be no DB record yet.
       */

      const existedBefore =
        originalAlbumsBySection[section].some(
          (item) =>
            String(item.id) ===
            String(album.id)
        );

      if (existedBefore) {
        const response =
          await fetch(
            `${API_BASE_URL}/api/gallery.php?slug=${encodeURIComponent(
              album.slug
            )}`,
            {
              method: "DELETE",
              headers:
                authenticatedHeaders(),
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to delete album."
          );
        }
      }

      updateSectionAlbums(section, (previous) => previous
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i })));
      updateSectionPhotos(section, (previous) => {
        const next = { ...previous };
        delete next[album.slug];
        return next;
      });

      if (
        expandedAlbumKey ===
        `${section}:${album.slug}`
      ) {
        setExpandedAlbumKey(null);
      }

      setSaveMsg(
        "Album deleted successfully."
      );

      await loadData();
    } catch (error: unknown) {
      console.error(
        "Delete album error:",
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to delete album."
      );
    }
  };

  /* =========================================================
     UPLOAD ALBUM PHOTOS
  ========================================================= */

  const queueAlbumPhotos = (
    section: GallerySection,
    slug: string,
    fileList: FileList | null
  ) => {
    if (!fileList?.length) return;

    const key = `photos-${section}-${slug}`;
    const currentPhotos = photosBySection[section][slug] || [];
    const existingQueue = photoQueues[key] || [];
    const pendingCount = existingQueue.filter((photo) => photo.status !== "uploaded").length;
    const available = Math.max(0, MAX_PHOTOS - currentPhotos.length - pendingCount);
    const seenFiles = new Set<File>(existingQueue.map((photo) => photo.file));
    const queuedFiles: File[] = [];
    const rejected: RejectedPhoto[] = [];

    for (const file of Array.from(fileList)) {
      const validationError = getPhotoFileError(file);
      if (validationError) {
        rejected.push({ fileName: file.name, message: validationError });
      } else if (seenFiles.has(file)) {
        rejected.push({ fileName: file.name, message: "This file is already selected in this batch." });
      } else if (queuedFiles.length >= available) {
        rejected.push({ fileName: file.name, message: `Album capacity is ${MAX_PHOTOS} photos; no upload slots remain.` });
      } else {
        seenFiles.add(file);
        queuedFiles.push(file);
      }
    }

    setRejectedPhotos((prev) => ({ ...prev, [key]: [...(prev[key] || []), ...rejected] }));
    if (queuedFiles.length) {
      const newItems = queuedFiles.map((file): QueuedPhoto => ({
        id: crypto.randomUUID(),
        file,
        status: "queued",
        progress: 0,
      }));
      setPhotoQueues((prev) => ({ ...prev, [key]: [...(prev[key] || []), ...newItems] }));
    }
  };

  const removeQueuedPhoto = (key: string, photoId: string) => {
    setPhotoQueues((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((photo) => photo.id !== photoId),
    }));
  };

  const clearPhotoQueue = (key: string) => {
    if (activePhotoQueueKeysRef.current.has(key)) return;
    setPhotoQueues((prev) => ({ ...prev, [key]: [] }));
    setRejectedPhotos((prev) => ({ ...prev, [key]: [] }));
  };

  const handleUploadAlbumPhotos = async (
    section: GallerySection,
    slug: string,
    retryFailed = false
  ) => {
    const key = `photos-${section}-${slug}`;
    if (activePhotoQueueKeysRef.current.has(key)) return;

    const queue = photoQueues[key] || [];
    const candidates = queue.filter((photo) => retryFailed
      ? photo.status === "failed"
      : photo.status === "queued");
    if (!candidates.length) return;

    const currentPhotos = photosBySection[section][slug] || [];
    const remaining = Math.max(0, MAX_PHOTOS - currentPhotos.length);
    if (candidates.length > remaining) {
      setErrMsg(`This album has room for only ${remaining} more photos.`);
      return;
    }

    activePhotoQueueKeysRef.current.add(key);
    setUploadingState((prev) => ({ ...prev, [key]: true }));
    setErrMsg("");

    const category = getMediaCategory(section, slug);
    const folder = getMediaFolder(section, slug);
    const uploadedMedia = new Map<string, CloudinaryUploadResult>();
    let nextIndex = 0;

    const updateQueueItem = (photoId: string, changes: Partial<QueuedPhoto>) => {
      setPhotoQueues((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((photo) => photo.id === photoId ? { ...photo, ...changes } : photo),
      }));
    };

    const uploadWorker = async () => {
      while (nextIndex < candidates.length) {
        const photo = candidates[nextIndex++];
        updateQueueItem(photo.id, {
          status: photo.media ? "saving" : "uploading",
          progress: photo.media ? 100 : 0,
          error: undefined,
        });
        try {
          const media = photo.media || await uploadToCloudinary(
            photo.file,
            folder,
            (progress) => updateQueueItem(photo.id, { progress })
          );
          if (!media?.url) throw new Error("The media service did not return an image URL.");
          uploadedMedia.set(photo.id, media);
          updateQueueItem(photo.id, { status: "saving", progress: 100, media, error: undefined });
        } catch (error: unknown) {
          updateQueueItem(photo.id, {
            status: "failed",
            error: error instanceof Error ? error.message : "Upload failed.",
          });
        }
      }
    };

    try {
      await Promise.all(Array.from(
        { length: Math.min(MAX_CONCURRENT_PHOTO_UPLOADS, candidates.length) },
        () => uploadWorker()
      ));

      const mediaCandidates = candidates
        .map((photo) => ({ photo, media: uploadedMedia.get(photo.id) || photo.media }))
        .filter((entry): entry is { photo: QueuedPhoto; media: CloudinaryUploadResult } => Boolean(entry.media));
      if (!mediaCandidates.length) return;

      const retryCandidates = mediaCandidates.filter(({ photo }) => Boolean(photo.media));
      const existingKeys = new Set<string>();
      if (retryCandidates.length) {
        const existingResponse = await fetch(
          `${API_BASE_URL}/api/gallery.php?slug=${encodeURIComponent(slug)}&section=${encodeURIComponent(section)}&include_inactive=1`,
          { headers: authenticatedHeaders(), cache: "no-store" }
        );
        const existingData = await parseApiResponse(existingResponse);
        if (!existingResponse.ok || !existingData.success) {
          throw new Error(existingData.message || "Could not verify saved photos before retrying.");
        }
        for (const existingPhoto of Array.isArray(existingData.photos) ? existingData.photos : []) {
          if (existingPhoto.publicId) existingKeys.add(`id:${existingPhoto.publicId}`);
          if (existingPhoto.imageUrl) existingKeys.add(`url:${existingPhoto.imageUrl}`);
        }
      }

      const toSave = mediaCandidates.filter(({ photo, media }) => {
        const alreadySaved = Boolean(
          (media.publicId && existingKeys.has(`id:${media.publicId}`)) ||
          (media.url && existingKeys.has(`url:${media.url}`))
        );
        if (alreadySaved) {
          updateQueueItem(photo.id, { status: "uploaded", progress: 100, error: undefined });
        }
        return !alreadySaved;
      });

      if (toSave.length) {
        const items = toSave.map(({ photo, media }, index) => ({
          category,
          title: getFileTitle(photo.file),
          imageUrl: media.url,
          publicId: media.publicId || "",
          resourceType: media.resourceType || "image",
          format: media.format || "",
          width: media.width || null,
          height: media.height || null,
          bytes: media.bytes || null,
          folder,
          order: currentPhotos.length + index,
          isActive: true,
        }));

        try {
          const response = await fetch(`${API_BASE_URL}/api/gallery.php`, {
            method: "POST",
            headers: authenticatedJsonHeaders(),
            body: JSON.stringify({ items }),
          });
          const data = await parseApiResponse(response);
          if (!response.ok || !data.success) {
            throw new Error(data.message || "Uploaded images could not be saved to the album.");
          }
          toSave.forEach(({ photo }) => updateQueueItem(photo.id, { status: "uploaded", progress: 100, error: undefined }));
          setSaveMsg(`${toSave.length} photo${toSave.length === 1 ? "" : "s"} added successfully.`);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to save uploaded photos.";
          toSave.forEach(({ photo, media }) => updateQueueItem(photo.id, { status: "failed", media, error: message }));
        }
      }

      await fetchAlbumPhotos(slug, section);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to verify or save album photos.";
      candidates.forEach((photo) => {
        const media = uploadedMedia.get(photo.id) || photo.media;
        if (media) updateQueueItem(photo.id, { status: "failed", media, error: message });
      });
      setErrMsg(message);
    } finally {
      activePhotoQueueKeysRef.current.delete(key);
      setUploadingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  /* =========================================================
     DELETE PHOTO
  ========================================================= */

  const handleDeleteAlbumPhoto =
    async (
      section: GallerySection,
      slug: string,
      photoId: string
    ) => {
      const confirmed =
        window.confirm(
          "Remove this photo from the album?"
        );

      if (!confirmed) return;

      try {
        setErrMsg("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/gallery.php?id=${encodeURIComponent(
              photoId
            )}`,
            {
              method: "DELETE",
              headers:
                authenticatedHeaders(),
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to delete photo."
          );
        }

        await fetchAlbumPhotos(
          slug,
          section
        );

        setSaveMsg(
          "Photo deleted successfully."
        );
      } catch (error: unknown) {
        console.error(
          "Delete photo error:",
          error
        );

        setErrMsg(
          error instanceof Error ? error.message : "Failed to delete photo."
        );
      }
    };

  /* =========================================================
     DELETE ALL PHOTOS
  ========================================================= */

  const handleDeleteAllAlbumPhotos =
    async (
      section: GallerySection,
      slug: string
    ) => {
      const confirmed =
        window.confirm(
          "Delete all photos from this story?"
        );

      if (!confirmed) return;

      try {
        setErrMsg("");

        const category = getMediaCategory(section, slug);

        const response =
          await fetch(
            `${API_BASE_URL}/api/gallery.php?action=delete_all&slug=${encodeURIComponent(
              slug
            )}&category=${encodeURIComponent(
              category
            )}&section=${encodeURIComponent(section)}`,
            {
              method: "DELETE",
              headers:
                authenticatedHeaders(),
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to delete all photos."
          );
        }

        await fetchAlbumPhotos(
          slug,
          section
        );

        setSaveMsg(
          "All photos deleted successfully."
        );
      } catch (error: unknown) {
        console.error(
          "Delete all photos error:",
          error
        );

        setErrMsg(
          error instanceof Error ? error.message : "Failed to delete all photos."
        );
      }
    };

  /* =========================================================
     MOVE PHOTO
  ========================================================= */

  const handleMoveAlbumPhoto =
    async (
      section: GallerySection,
      slug: string,
      photoIndex: number,
      direction: number,
      dropTarget?: number
    ) => {
      const list = photosBySection[section][slug] || [];

      const target = dropTarget ?? photoIndex + direction;

      if (
        target < 0 ||
        target >= list.length
      ) {
        return;
      }

      if (target === photoIndex) return;

      const copy = [...list];
      const [movedPhoto] = copy.splice(photoIndex, 1);
      copy.splice(target, 0, movedPhoto);

      const reordered =
        copy.map(
          (photo, index) => ({
            ...photo,
            order: index,
          })
        );

      updateSectionPhotos(section, (previous) => ({ ...previous, [slug]: reordered }));

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/gallery.php`,
            {
              method: "PUT",
              headers:
                authenticatedJsonHeaders(),

              body: JSON.stringify({
                action:
                  "reorder",

                items:
                  reordered.map(
                    (photo) => ({
                      id: photo.id,
                      order:
                        photo.order,
                    })
                  ),
              }),
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to save photo order."
          );
        }

        setSaveMsg(
          "Photo order saved."
        );
      } catch (error: unknown) {
        console.error(
          "Reorder photo error:",
          error
        );

        await fetchAlbumPhotos(
          slug,
          section
        );

        setErrMsg(
          error instanceof Error ? error.message : "Failed to save photo order."
        );
      }
    };

  /* =========================================================
     REPLACE PHOTO
  ========================================================= */

  const handleReplaceAlbumPhoto =
    async (
      section: GallerySection,
      slug: string,
      photoId: string,
      file: File | undefined
    ) => {
      if (!file) return;

      const validationError = getPhotoFileError(file);
      if (validationError) {
        setErrMsg(`${file.name}: ${validationError}`);
        return;
      }

      const replacementKey = `replace-${photoId}`;
      if (activePhotoQueueKeysRef.current.has(replacementKey)) return;
      activePhotoQueueKeysRef.current.add(replacementKey);
      setUploadingState((prev) => ({ ...prev, [replacementKey]: true }));

      const folder = getMediaFolder(section, slug);

      try {
        setErrMsg("");

        const result =
          await uploadToCloudinary(
            file,
            folder
          );

        if (!result?.url) {
          throw new Error(
            "Cloudinary did not return an image URL."
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/gallery.php`,
            {
              method: "PUT",
              headers:
                authenticatedJsonHeaders(),

              body: JSON.stringify({
                id: photoId,

                imageUrl:
                  result.url,

                publicId:
                  result.publicId ||
                  "",

                resourceType:
                  result.resourceType ||
                  "image",

                format:
                  result.format ||
                  "",

                width:
                  result.width ||
                  null,

                height:
                  result.height ||
                  null,

                bytes:
                  result.bytes ||
                  null,

                folder,
              }),
            }
          );

        const data =
          await parseApiResponse(
            response
          );

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to update photo in MySQL."
          );
        }

        await fetchAlbumPhotos(
          slug,
          section
        );

        setSaveMsg(
          "Photo replaced successfully."
        );
      } catch (error: unknown) {
        console.error(
          "Replace photo error:",
          error
        );

        setErrMsg(
          error instanceof Error ? error.message : "Failed to replace photo."
        );
      } finally {
        activePhotoQueueKeysRef.current.delete(replacementKey);
        setUploadingState((prev) => ({ ...prev, [replacementKey]: false }));
      }
    };

  /* =========================================================
     SAVE GALLERY
  ========================================================= */

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMsg("");
      setErrMsg("");

      const normalizedAlbumsBySection = Object.fromEntries(
        GALLERY_SECTIONS.map((section) => [
          section,
          getSectionAlbums(section).map((album, index) => ({
            ...album,
            id: String(album.id || `${section}-${index}`),
            slug: createSlug(album.slug),
            name: album.name.trim(),
            location: album.location?.trim() || "",
            image: album.image || "",
            order: index,
          })),
        ])
      ) as Record<GallerySection, GalleryAdminAlbum[]>;
      const allAlbums = GALLERY_SECTIONS.flatMap((section) => normalizedAlbumsBySection[section]);

      for (const section of GALLERY_SECTIONS) {
        if (normalizedAlbumsBySection[section].length > MAX_ALBUMS_BY_SECTION[section]) {
          throw new Error(`Maximum ${MAX_ALBUMS_BY_SECTION[section]} ${GALLERY_SECTION_LABELS[section]} albums are allowed.`);
        }
      }

      /* -----------------------------------------------------
         TOTAL CARD LIMIT
      ----------------------------------------------------- */

      if (
        allAlbums.length >
        MAX_CARDS
      ) {
        throw new Error(
          `Maximum ${MAX_CARDS} albums are allowed across all gallery categories.`
        );
      }

      /* -----------------------------------------------------
         VALIDATE
      ----------------------------------------------------- */

      for (const album of allAlbums) {
        if (!album.name) {
          throw new Error(
            "Every album must have a name."
          );
        }

        if (!album.slug) {
          throw new Error(
            `Album "${album.name}" has an empty slug.`
          );
        }
      }

      const slugSet =
        new Set();

      for (const album of allAlbums) {
        if (
          slugSet.has(
            album.slug
          )
        ) {
          throw new Error(
            `Duplicate slug "${album.slug}". Slugs must be unique across all gallery categories.`
          );
        }

        slugSet.add(
          album.slug
        );
      }

      /* -----------------------------------------------------
         HANDLE EXISTING ALBUM SLUG CHANGES
      ----------------------------------------------------- */

      const existingSections = GALLERY_SECTIONS.map((section) => ({
        current: normalizedAlbumsBySection[section],
        original: originalAlbumsBySection[section],
        section,
      }));

      for (
        const group of existingSections
      ) {
        const originalById =
          new Map(
            group.original.map(
              (album) => [
                String(album.id),
                album,
              ]
            )
          );

        for (
          const nextAlbum of
            group.current
        ) {
          const previousAlbum =
            originalById.get(
              String(
                nextAlbum.id
              )
            );

          /*
           * Only existing DB albums need
           * update_album.
           *
           * New albums will be created
           * by content.php below.
           */

          if (
            previousAlbum &&
            previousAlbum.slug !==
              nextAlbum.slug
          ) {
            const response =
              await fetch(
                `${API_BASE_URL}/api/gallery.php`,
                {
                  method: "PUT",
                  headers:
                    authenticatedJsonHeaders(),

                  body: JSON.stringify({
                    action:
                      "update_album",

                    section:
                      group.section,

                    oldSlug:
                      previousAlbum.slug,

                    slug:
                      nextAlbum.slug,

                    name:
                      nextAlbum.name,

                    location:
                      nextAlbum.location,

                    image:
                      nextAlbum.image,

                    order:
                      nextAlbum.order,
                  }),
                }
              );

            const data =
              await parseApiResponse(
                response
              );

            if (
              !response.ok ||
              !data.success
            ) {
              throw new Error(
                data.message ||
                  `Failed to update album "${previousAlbum.name}".`
              );
            }

            /*
             * Move local photo state.
             */

            updateSectionPhotos(group.section, (previous) => {
              const next = { ...previous };
              if (next[previousAlbum.slug]) {
                next[nextAlbum.slug] = next[previousAlbum.slug];
                delete next[previousAlbum.slug];
              }
              return next;
            });
          }
        }
      }

      /* -----------------------------------------------------
         SAVE CONTENT METADATA
      ----------------------------------------------------- */

      const response =
        await fetch(
          `${API_BASE_URL}/api/content.php`,
          {
            method: "PUT",
            headers:
              authenticatedJsonHeaders(),

            body: JSON.stringify({
              content: {
                gallery: {
                  ...header,

                  wedding: normalizedAlbumsBySection.wedding,
                  engagement: normalizedAlbumsBySection.engagement,
                  preWedding: normalizedAlbumsBySection.preWedding,
                },
              },
            }),
          }
        );

      const data =
        await parseApiResponse(
          response
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to save Gallery configuration."
        );
      }

      /* -----------------------------------------------------
         FINAL DATABASE VERIFICATION
      ----------------------------------------------------- */

      await loadData();

      setSaveMsg(
        "Gallery successfully saved and verified from database."
      );
    } catch (error: unknown) {
      console.error(
        "Gallery save error:",
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to save Gallery."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     RENDER PHOTO GRID
  ========================================================= */

  const renderPhotoManager = ({
    section,
    slug,
    name,
  }: { section: GallerySection; slug: string; name: string }) => {
    const photos = photosBySection[section][slug] || [];
    const isLoading = loadingPhotosBySection[section][slug];

    const photoCount =
      photos.length;

    const remaining =
      Math.max(
        0,
        MAX_PHOTOS -
          photoCount
      );

    const uploadKey =
      `photos-${section}-${slug}`;

    const isUploading =
      uploadingState[
        uploadKey
      ];
    const queuedPhotos = photoQueues[uploadKey] || [];
    const rejectedFiles = rejectedPhotos[uploadKey] || [];
    const queuedCount = queuedPhotos.filter((photo) => photo.status === "queued").length;
    const failedCount = queuedPhotos.filter((photo) => photo.status === "failed").length;
    const uploadedCount = queuedPhotos.filter((photo) => photo.status === "uploaded").length;
    const processedCount = uploadedCount + failedCount;
    const queueProgress = queuedPhotos.length
      ? Math.round(queuedPhotos.reduce(
          (total, photo) => total + (photo.status === "uploaded" || photo.status === "failed" ? 100 : photo.progress),
          0
        ) / queuedPhotos.length)
      : 0;

    return (
      <div className="border-t border-neutral-200 bg-[#f7f5f0] p-5">

        {/* ---------------------------------------------------
            PHOTO HEADER
        --------------------------------------------------- */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-700">
              Photos for "{name}"
            </h4>

            <p className="text-[11px] text-neutral-500 mt-1">
              {photoCount}/{MAX_PHOTOS} photos used
              {" • "}
              {remaining} remaining
            </p>

            <p className="text-[11px] text-neutral-400 mt-1">
              MySQL category:{" "}
              <code className="text-[#9b7740] font-mono">
                {getMediaCategory(section, slug)}
              </code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {photoCount > 0 && (
              <button
                type="button"
                onClick={() => handleDeleteAllAlbumPhotos(section, slug)}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium uppercase tracking-[0.15em] border border-red-200 bg-white text-red-600 hover:bg-red-50 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Photos</span>
              </button>
            )}
          </div>
        </div>

        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            queueAlbumPhotos(section, slug, event.dataTransfer.files);
          }}
          className="mb-5 flex flex-col items-center justify-between gap-4 rounded-lg border-2 border-dashed border-[#cfc5b4] bg-white/70 px-4 py-5 text-center sm:flex-row sm:text-left"
        >
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-700">
              Add Photos to {name}
            </h5>
            <p className="mt-1 text-[11px] text-neutral-500">Drag and drop multiple photos here, or choose files.</p>
            <p className="mt-1 text-[10px] text-neutral-400">JPG, JPEG, PNG, WEBP · up to 25 MiB per image · maximum {MAX_PHOTOS} photos per album</p>
          </div>
          <label className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-white shadow-sm ${remaining <= 0 || isUploading ? "cursor-not-allowed bg-neutral-400" : "bg-[#9b7740] hover:bg-[#856535]"}`}>
            <Plus className="h-3.5 w-3.5" />
            <span>{remaining <= 0 ? "Album Full" : "Add Photos"}</span>
            {remaining > 0 && !isUploading && (
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  queueAlbumPhotos(section, slug, event.target.files);
                  event.target.value = "";
                }}
              />
            )}
          </label>
        </div>

        {(queuedPhotos.length > 0 || rejectedFiles.length > 0) && (
          <div className="mb-5 rounded-lg border border-neutral-200 bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-700">
                  {isUploading ? `Uploading ${processedCount} / ${queuedPhotos.length}` : `${queuedPhotos.length} photos selected`}
                </p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  {queuedCount} ready · {uploadedCount} uploaded · {failedCount} failed
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {failedCount > 0 && (
                  <button type="button" onClick={() => handleUploadAlbumPhotos(section, slug, true)} disabled={isUploading} className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-amber-800 disabled:opacity-50">
                    Retry Failed ({failedCount})
                  </button>
                )}
                {queuedCount > 0 && (
                  <button type="button" onClick={() => handleUploadAlbumPhotos(section, slug)} disabled={isUploading} className="rounded bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white disabled:opacity-50">
                    Upload {queuedCount} Photos
                  </button>
                )}
                <button type="button" onClick={() => clearPhotoQueue(uploadKey)} disabled={isUploading} className="rounded border border-neutral-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-600 disabled:opacity-50">
                  Clear All
                </button>
              </div>
            </div>

            {isUploading && (
              <div className="mt-3" aria-live="polite">
                <div className="mb-1 flex justify-between text-[10px] text-neutral-500">
                  <span>{processedCount} / {queuedPhotos.length} processed</span><span>{queueProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full bg-[#9b7740] transition-all" style={{ width: `${queueProgress}%` }} />
                </div>
              </div>
            )}

            {rejectedFiles.length > 0 && (
              <div className="mt-3 space-y-1 rounded border border-red-100 bg-red-50 p-2">
                {rejectedFiles.map((file, index) => (
                  <p key={`${file.fileName}-${index}`} className="break-all text-[10px] text-red-700">
                    <span className="font-semibold">{file.fileName}</span>: {file.message}
                  </p>
                ))}
              </div>
            )}

            {queuedPhotos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {queuedPhotos.map((photo) => (
                  <div key={photo.id} className="flex min-w-0 gap-2 rounded border border-neutral-200 bg-[#fbfaf7] p-2">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-neutral-100">
                      <QueuedPhotoPreview file={photo.file} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-neutral-700" title={photo.file.name}>{photo.file.name}</p>
                      <p className={`mt-0.5 text-[9px] font-semibold uppercase ${photo.status === "failed" ? "text-red-600" : photo.status === "uploaded" ? "text-emerald-700" : "text-neutral-500"}`}>
                        {photo.status === "queued" ? "Ready" : photo.status === "uploading" ? `Uploading ${photo.progress}%` : photo.status === "saving" ? "Saving" : photo.status === "uploaded" ? "Uploaded" : "Failed"}
                      </p>
                      {photo.error && <p className="mt-0.5 line-clamp-2 text-[9px] text-red-600">{photo.error}</p>}
                      {(photo.status === "uploading" || photo.status === "saving") && (
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-200">
                          <div className="h-full bg-[#9b7740] transition-all" style={{ width: `${photo.progress}%` }} />
                        </div>
                      )}
                    </div>
                    {!isUploading && photo.status !== "uploaded" && (
                      <button type="button" onClick={() => removeQueuedPhoto(uploadKey, photo.id)} aria-label={`Remove ${photo.file.name} from upload list`} className="self-start rounded p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------
            CAPACITY
        --------------------------------------------------- */}

        <div className="mb-5">

          <div className="flex justify-between text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5">
            <span>
              Album Capacity
            </span>

            <span>
              {photoCount} / {MAX_PHOTOS}
            </span>
          </div>

          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#9b7740] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (photoCount /
                    MAX_PHOTOS) *
                    100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* ---------------------------------------------------
            LOADING
        --------------------------------------------------- */}

        {isLoading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-neutral-500">
            <RefreshCw className="w-4 h-4 animate-spin text-[#9b7740]" />

            <span className="text-xs">
              Loading album photos...
            </span>
          </div>
        ) : photoCount === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-neutral-200 rounded-lg bg-white/50">

            <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />

            <p className="text-xs text-neutral-500">
              No photos added yet.
            </p>

            <p className="text-[11px] text-neutral-400 mt-1">
              Upload photos in multiple batches until you reach {MAX_PHOTOS}.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">

            {photos.map(
              (
                photo,
                photoIndex
              ) => (
                <div
                  key={
                    photo.id
                  }
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", photo.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const draggedPhotoId = event.dataTransfer.getData("text/plain");
                    const draggedPhotoIndex = photos.findIndex((item) => item.id === draggedPhotoId);
                    if (draggedPhotoIndex >= 0) {
                      handleMoveAlbumPhoto(section, slug, draggedPhotoIndex, 0, photoIndex);
                    }
                  }}
                  className="group relative cursor-grab touch-pan-y bg-white rounded border border-neutral-200 overflow-hidden shadow-xs active:cursor-grabbing"
                >

                  <div className="aspect-square bg-neutral-100 overflow-hidden">

                    <img
                      src={
                        photo.imageUrl
                      }
                      alt={
                        photo.title ||
                        "Photo"
                      }
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                  </div>

                  {/* HOVER CONTROLS */}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">

                    {/* DELETE */}

                    <div className="flex justify-end gap-1">

                      <button
                        title="Delete Photo"
                        onClick={() =>
                          handleDeleteAlbumPhoto(
                            section,
                            slug,
                            photo.id
                          )
                        }
                        className="p-1 bg-black/50 hover:bg-rose-600 text-white rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex items-center justify-between gap-1">

                      <div className="flex gap-1">

                        <button
                          title="Move Left"
                          disabled={
                            photoIndex ===
                            0
                          }
                          onClick={() =>
                            handleMoveAlbumPhoto(
                              section,
                              slug,
                              photoIndex,
                              -1
                            )
                          }
                          className="p-1 bg-black/50 hover:bg-neutral-800 disabled:opacity-20 text-white rounded"
                        >
                          <ArrowUp className="w-3 h-3 -rotate-90" />
                        </button>

                        <button
                          title="Move Right"
                          disabled={
                            photoIndex ===
                            photos.length -
                              1
                          }
                          onClick={() =>
                            handleMoveAlbumPhoto(
                              section,
                              slug,
                              photoIndex,
                              1
                            )
                          }
                          className="p-1 bg-black/50 hover:bg-neutral-800 disabled:opacity-20 text-white rounded"
                        >
                          <ArrowDown className="w-3 h-3 -rotate-90" />
                        </button>

                      </div>

                      {/* REPLACE */}

                      <label
                        title="Replace"
                        className="p-1 bg-black/50 hover:bg-[#9b7740] text-white rounded cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />

                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(
                            e
                          ) => {
                            const file =
                              e
                                .target
                                .files?.[0];

                            handleReplaceAlbumPhoto(
                              section,
                              slug,
                              photo.id,
                              file
                            );

                            e.target.value =
                              "";
                          }}
                        />
                      </label>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>
    );
  };

  /* =========================================================
     RENDER ALBUM CARD
  ========================================================= */

  const renderAlbumCard = ({
    album,
    index,
    section,
  }: { album: GalleryAdminAlbum; index: number; section: GallerySection }) => {
    const expandedKey =
      `${section}:${album.slug}`;

    const isExpanded =
      expandedAlbumKey ===
      expandedKey;

    const photos = photosBySection[section][album.slug] || [];
    const hasLoadedPhotos = photosBySection[section][album.slug] !== undefined;

    const photoCount =
      hasLoadedPhotos
        ? photos.length
        : album.photoCount || 0;

    const coverKey =
      `cover-${section}-${index}`;

    const isUploadingCover =
      uploadingState[
        coverKey
      ];

    return (
      <div
        key={
          album.id ||
          `${section}-${album.slug}`
        }
        className="border border-neutral-200 rounded-lg overflow-hidden bg-[#fdfcfb] transition-all"
      >

        {/* ===================================================
            ALBUM HEADER
        =================================================== */}

        <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div className="flex items-center gap-4 flex-1 min-w-0">

            {/* COVER */}

            <div className="relative w-16 h-16 rounded overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300">

              {album.image ? (
                <img
                  src={
                    album.image
                  }
                  alt={
                    album.name
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <label
                className={`absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-opacity cursor-pointer ${
                  isUploadingCover
                    ? "opacity-100 cursor-wait"
                    : "opacity-0 hover:opacity-100"
                }`}
              >
                {isUploadingCover ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}

                <input
                  type="file"
                  accept="image/*"
                  disabled={
                    isUploadingCover
                  }
                  className="hidden"
                  onChange={(
                    e
                  ) => {
                    const file =
                      e
                        .target
                        .files?.[0];

                    handleUploadAlbumCover(
                      section,
                      index,
                      file
                    );

                    e.target.value =
                      "";
                  }}
                />
              </label>

            </div>

            {/* FIELDS */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 flex-1 min-w-0">

              {/* NAME */}

              <div>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-neutral-400">
                  Album Name
                </span>

                <input
                  type="text"
                  value={
                    album.name
                  }
                  onChange={(
                    e
                  ) =>
                    handleUpdateAlbum(
                      section,
                      index,
                      "name",
                      e.target
                        .value
                    )
                  }
                  className="w-full text-xs font-medium border border-neutral-200 rounded px-2.5 py-1.5 bg-white"
                />
              </div>

              {/* SLUG */}

              <div>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-neutral-400">
                  Slug
                </span>

                <input
                  type="text"
                  value={
                    album.slug
                  }
                  onChange={(
                    e
                  ) =>
                    handleUpdateAlbum(
                      section,
                      index,
                      "slug",
                      e.target
                        .value
                    )
                  }
                  className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white text-neutral-600"
                />
              </div>

              {/* LOCATION */}

              <div>
                <span className="text-[9px] uppercase font-semibold tracking-wider text-neutral-400">
                  City / Location
                </span>

                <input
                  type="text"
                  value={
                    album.location
                  }
                  placeholder="e.g. Udaipur, Rajasthan"
                  onChange={(
                    e
                  ) =>
                    handleUpdateAlbum(
                      section,
                      index,
                      "location",
                      e.target
                        .value
                    )
                  }
                  className="w-full text-xs border border-neutral-200 rounded px-2.5 py-1.5 bg-white text-neutral-600"
                />
              </div>

            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex items-center gap-2 self-end lg:self-center">

            {/* UP */}

            <button
              title="Move Up"
              disabled={
                index === 0
              }
              onClick={() =>
                handleMoveAlbum(
                  section,
                  index,
                  -1
                )
              }
              className="p-1.5 text-neutral-500 hover:text-neutral-800 disabled:opacity-30 border border-neutral-200 rounded bg-white"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            {/* DOWN */}

            <button
              title="Move Down"
              disabled={
                index === getSectionAlbums(section).length - 1
              }
              onClick={() =>
                handleMoveAlbum(
                  section,
                  index,
                  1
                )
              }
              className="p-1.5 text-neutral-500 hover:text-neutral-800 disabled:opacity-30 border border-neutral-200 rounded bg-white"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            {/* MANAGE */}

            <button
              onClick={() =>
                toggleAlbum(
                  album.slug,
                  section
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f0ede6] hover:bg-[#e6e2d8] text-neutral-800 rounded text-xs font-medium tracking-wide transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#9b7740]" />

              <span>
                {isExpanded
                  ? "Hide Photos"
                  : `Manage Photos (${photoCount}/${MAX_PHOTOS})`}
              </span>

              {isExpanded ? (
                <span className="text-xs font-bold leading-none">↑</span>
              ) : (
                <span className="text-xs font-bold leading-none">↓</span>
              )}
            </button>

            {/* DELETE */}

            <button
              title="Delete Album"
              onClick={() =>
                handleDeleteAlbum(
                  section,
                  index
                )
              }
              className="p-1.5 text-neutral-400 hover:text-rose-600 border border-neutral-200 rounded bg-white"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

        {/* ===================================================
            PHOTO MANAGER
        =================================================== */}

        {isExpanded &&
          renderPhotoManager({
            section,
            slug:
              album.slug,
            name:
              album.name,
          })}

      </div>
    );
  };

  /* =========================================================
     RENDER LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f6f2ea]">

        <div className="flex items-center gap-3 text-neutral-600">

          <RefreshCw className="w-5 h-5 animate-spin text-[#9b7740]" />

          <span className="text-sm font-medium tracking-wide">
            Loading Gallery Management...
          </span>

        </div>

      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f6f2ea] pb-32">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="border-b border-neutral-200 bg-[#fbfaf7] sticky top-0 z-30 shadow-sm">

        <div className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <span className="text-[10px] uppercase font-semibold tracking-[0.3em] text-[#9b7740]">
                PHP & MySQL Module
              </span>

              <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full font-mono">
                gallery_media
              </span>

              <span className="text-[10px] bg-[#f0ede6] text-neutral-700 px-2 py-0.5 rounded-full font-medium">
                {totalCards}/{MAX_CARDS} Cards
              </span>

            </div>

            <h1 className="text-2xl sm:text-3xl font-light text-neutral-900 tracking-tight mt-1">
              Gallery Management
            </h1>

            <p className="text-xs text-neutral-400 mt-1">
              Wedding, Engagement, and Pre Wedding • Maximum {MAX_CARDS} albums • {MAX_PHOTOS} photos per album
            </p>

          </div>

          <button
            onClick={
              handleSave
            }
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-sm ${
              saving
                ? "bg-neutral-400 text-white cursor-wait"
                : hasChanges
                ? "bg-[#9b7740] hover:bg-[#856535] text-white"
                : "bg-neutral-800 hover:bg-neutral-900 text-white"
            }`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />

                {hasChanges
                  ? "Save Changes *"
                  : "Saved"}
              </>
            )}
          </button>

        </div>
      </div>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 mt-4">

        {saveMsg && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-sm mb-4">

            <Check className="w-4 h-4 shrink-0 text-emerald-600" />

            <span>
              {saveMsg}
            </span>

          </div>
        )}

        {errMsg && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded text-sm mb-4">

            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />

            <span>
              {errMsg}
            </span>

          </div>
        )}

      </div>

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 space-y-10 mt-6">

        {/* ===================================================
            SECTION 01 — HEADER
        =================================================== */}

        <section className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">

          <div className="border-b border-neutral-100 pb-4 mb-6 flex items-center justify-between">

            <div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">
                SECTION 01
              </span>

              <h2 className="text-xl font-normal text-neutral-800 tracking-tight mt-0.5">
                Gallery Header & Intro
              </h2>

            </div>

            <Sparkles className="w-5 h-5 text-neutral-300" />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* EYEBROW */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Eyebrow
              </label>

              <input
                type="text"
                value={
                  header.heroEyebrow
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    heroEyebrow:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* HEADING 1 */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Heading Line 1
              </label>

              <input
                type="text"
                value={
                  header.heroHeadingLine1
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    heroHeadingLine1:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* HEADING 2 */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Heading Line 2
              </label>

              <input
                type="text"
                value={
                  header.heroHeadingLine2
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    heroHeadingLine2:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Description
              </label>

              <textarea
                rows={3}
                value={
                  header.heroDescription
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    heroDescription:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

          </div>
        </section>

        {/* ===================================================
            SECTION 02 — PHOTO GALLERY
        =================================================== */}

        <section className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">

          <div className="border-b border-neutral-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">
                SECTION 02
              </span>

              <h2 className="text-xl font-normal text-neutral-800 tracking-tight mt-0.5">
                Wedding Albums ({albumsBySection.wedding.length}/{MAX_ALBUMS_BY_SECTION.wedding})
              </h2>

              <p className="text-xs text-neutral-400 mt-1">
                Maximum {MAX_ALBUMS_BY_SECTION.wedding} albums • Maximum {MAX_PHOTOS} photos per album.
              </p>

            </div>

            <button
              onClick={() =>
                openAddAlbum(
                  "wedding"
                )
              }
              disabled={
                isAtAlbumLimit("wedding") || totalCards >= MAX_CARDS
              }
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs uppercase tracking-[0.15em] font-medium self-start sm:self-auto ${
                isAtAlbumLimit("wedding") || totalCards >= MAX_CARDS
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >

              <Plus className="w-3.5 h-3.5" />

              Add New Album

            </button>

          </div>

          <div className="mb-5 flex items-center justify-between p-3 bg-[#faf8f5] border border-[#e8dfd1] rounded-lg">

            <div>

              <p className="text-xs font-semibold text-neutral-700">
                Card Limit
              </p>

              <p className="text-[11px] text-neutral-400 mt-0.5">
                All categories combined
              </p>

            </div>

            <div className="text-right">

              <p className="text-sm font-semibold text-[#9b7740]">
                {totalCards} / {MAX_CARDS}
              </p>

              <p className="text-[10px] text-neutral-400">
                {remainingCards} slots remaining
              </p>

            </div>

          </div>

          {/* ADD ALBUM */}

          {showAddAlbum &&
              newAlbumSection ===
              "wedding" && (
              <AddAlbumForm
                section="wedding"
                newAlbum={
                  newAlbum
                }
                setNewAlbum={
                  setNewAlbum
                }
                onConfirm={
                  handleAddAlbum
                }
                onCancel={() =>
                  setShowAddAlbum(
                    false
                  )
                }
              />
            )}

          {/* ALBUM LIST */}

          <div className="space-y-4">

            {albumsBySection.wedding.length ===
            0 ? (
              <EmptyAlbumState
                title="No Wedding albums"
                description="Create your first Wedding album."
                onAdd={() =>
                  openAddAlbum(
                    "wedding"
                  )
                }
                disabled={
                  isAtAlbumLimit("wedding") || totalCards >= MAX_CARDS
                }
              />
            ) : (
              albumsBySection.wedding.map(
                (
                  album,
                  index
                ) =>
                  renderAlbumCard({
                    album,
                    index,
                    section: "wedding",
                  })
              )
            )}

          </div>

        </section>

        {/* ===================================================
            SECTION 03 — ENGAGEMENT ALBUMS
        =================================================== */}

        <section className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">

          <div className="border-b border-neutral-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">
                SECTION 03
              </span>

              <h2 className="text-xl font-normal text-neutral-800 tracking-tight mt-0.5">
                Engagement Albums ({albumsBySection.engagement.length}/{MAX_ALBUMS_BY_SECTION.engagement})
              </h2>

              <p className="text-xs text-neutral-400 mt-1">
                Maximum {MAX_ALBUMS_BY_SECTION.engagement} albums • Maximum {MAX_PHOTOS} photos per album.
              </p>

            </div>

            <button
              onClick={() =>
                openAddAlbum(
                  "engagement"
                )
              }
              disabled={
                isAtAlbumLimit("engagement") || totalCards >= MAX_CARDS
              }
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs uppercase tracking-[0.15em] font-medium self-start sm:self-auto ${
                isAtAlbumLimit("engagement") || totalCards >= MAX_CARDS
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >

              <Plus className="w-3.5 h-3.5" />

              Add Engagement Album

            </button>

          </div>

          {/* ADD RECENT */}

          {showAddAlbum &&
            newAlbumSection ===
              "engagement" && (
              <AddAlbumForm
                section="engagement"
                newAlbum={
                  newAlbum
                }
                setNewAlbum={
                  setNewAlbum
                }
                onConfirm={
                  handleAddAlbum
                }
                onCancel={() =>
                  setShowAddAlbum(
                    false
                  )
                }
              />
            )}

          {/* RECENT LIST */}

          <div className="space-y-4">

            {albumsBySection.engagement.length ===
            0 ? (
              <EmptyAlbumState
                title="No Engagement albums"
                description="Create an Engagement album and upload its photos progressively."
                onAdd={() =>
                  openAddAlbum(
                    "engagement"
                  )
                }
                disabled={
                  isAtAlbumLimit("engagement") || totalCards >= MAX_CARDS
                }
              />
            ) : (
              albumsBySection.engagement.map(
                (
                  album,
                  index
                ) =>
                  renderAlbumCard({
                    album,
                    index,
                    section: "engagement",
                  })
              )
            )}

          </div>

        </section>

        <section className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">
          <div className="border-b border-neutral-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">SECTION 04</span>
              <h2 className="text-xl font-normal text-neutral-800 tracking-tight mt-0.5">
                Pre Wedding Albums ({albumsBySection.preWedding.length}/{MAX_ALBUMS_BY_SECTION.preWedding})
              </h2>
              <p className="text-xs text-neutral-400 mt-1">Maximum {MAX_ALBUMS_BY_SECTION.preWedding} albums • Maximum {MAX_PHOTOS} photos per album.</p>
            </div>
            <button
              onClick={() => openAddAlbum("preWedding")}
              disabled={isAtAlbumLimit("preWedding") || totalCards >= MAX_CARDS}
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs uppercase tracking-[0.15em] font-medium self-start sm:self-auto ${isAtAlbumLimit("preWedding") || totalCards >= MAX_CARDS ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" : "bg-neutral-900 text-white hover:bg-neutral-800"}`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Pre Wedding Album
            </button>
          </div>

          {showAddAlbum && newAlbumSection === "preWedding" && (
            <AddAlbumForm
              section="preWedding"
              newAlbum={newAlbum}
              setNewAlbum={setNewAlbum}
              onConfirm={handleAddAlbum}
              onCancel={() => setShowAddAlbum(false)}
            />
          )}

          <div className="space-y-4">
            {albumsBySection.preWedding.length === 0 ? (
              <EmptyAlbumState
                title="No Pre Wedding albums"
                description="Create a Pre Wedding album and upload its photos progressively."
                onAdd={() => openAddAlbum("preWedding")}
                disabled={isAtAlbumLimit("preWedding") || totalCards >= MAX_CARDS}
              />
            ) : (
              albumsBySection.preWedding.map((album, index) => renderAlbumCard({ album, index, section: "preWedding" }))
            )}
          </div>
        </section>

        {/* ===================================================
            SECTION 05 — CTA
        =================================================== */}

        <section className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">

          <div className="border-b border-neutral-100 pb-4 mb-6">

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">
              SECTION 04
            </span>

            <h2 className="text-xl font-normal text-neutral-800 tracking-tight mt-0.5">
              Gallery CTA
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CTA EYEBROW */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                CTA Eyebrow
              </label>

              <input
                type="text"
                value={
                  header.ctaEyebrow
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    ctaEyebrow:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* CTA BUTTON */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Button Text
              </label>

              <input
                type="text"
                value={
                  header.ctaButtonText
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    ctaButtonText:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* HEADING 1 */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Heading Line 1
              </label>

              <input
                type="text"
                value={
                  header.ctaHeadingLine1
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    ctaHeadingLine1:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* HEADING 2 */}

            <div>

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                Heading Line 2
              </label>

              <input
                type="text"
                value={
                  header.ctaHeadingLine2
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    ctaHeadingLine2:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                CTA Description
              </label>

              <textarea
                rows={3}
                value={
                  header.ctaDescription
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    ctaDescription:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

            {/* HREF */}

            <div className="md:col-span-2">

              <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">
                CTA Button URL
              </label>

              <input
                type="text"
                value={
                  header.ctaButtonHref
                }
                onChange={(
                  e
                ) =>
                  setHeader({
                    ...header,
                    ctaButtonHref:
                      e.target.value,
                  })
                }
                className="w-full text-sm border border-neutral-200 rounded px-3.5 py-2.5 focus:border-[#9b7740] focus:outline-none bg-neutral-50/50"
              />

            </div>

          </div>

        </section>

        {/* ===================================================
            SECTION 05 — PERSISTENCE
        =================================================== */}

        <section className="bg-[#181715] text-white rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg">

          <div>

            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">
              SECTION 06 — PERSISTENCE
            </span>

            <h3 className="text-lg font-light tracking-tight mt-1">
              Save & Verify Database State
            </h3>

            <p className="text-xs text-neutral-400 mt-1">
              Album metadata is stored in{" "}
              <code className="text-neutral-300 font-mono">
                website_content.gallery
              </code>
              . Photos are stored independently in{" "}
              <code className="text-neutral-300 font-mono">
                gallery_media
              </code>
              .
            </p>

            <p className="text-[11px] text-neutral-500 mt-2">
              Total cards: {totalCards}/{MAX_CARDS}
              {" • "}
              Wedding: {albumsBySection.wedding.length}
              {" • "}
              Engagement: {albumsBySection.engagement.length}
              {" • "}
              Pre Wedding: {albumsBySection.preWedding.length}
              {" • "}
              Maximum photos/card: {MAX_PHOTOS}
            </p>

          </div>

          <button
            onClick={
              handleSave
            }
            disabled={saving}
            className={`px-8 py-3 rounded text-xs uppercase tracking-[0.2em] font-medium transition-all shadow-md ${
              saving
                ? "bg-neutral-600 text-neutral-300 cursor-wait"
                : "bg-[#9b7740] hover:bg-[#b0884d] text-white"
            }`}
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>

        </section>

      </div>
    </div>
  );
}

/* ===========================================================
   ADD ALBUM FORM
=========================================================== */

function AddAlbumForm({
  section,
  newAlbum,
  setNewAlbum,
  onConfirm,
  onCancel,
}: { section: GallerySection; newAlbum: Pick<GalleryAdminAlbum, "name" | "slug" | "location" | "image">; setNewAlbum: React.Dispatch<React.SetStateAction<Pick<GalleryAdminAlbum, "name" | "slug" | "location" | "image">>>; onConfirm: () => void; onCancel: () => void }) {
  const sectionLabel = GALLERY_SECTION_LABELS[section];

  return (
    <div className="mb-8 p-5 bg-[#faf8f5] border border-[#e8dfd1] rounded-lg">

      <div className="flex items-center justify-between mb-4">

        <div>

          <h3 className="text-sm font-semibold text-neutral-800 uppercase tracking-[0.1em]">
            Create New{" "}
            {sectionLabel} Album
          </h3>

          <p className="text-[11px] text-neutral-400 mt-1">
            Cover image is optional and is separate from the {MAX_PHOTOS}-photo album limit.
          </p>

        </div>

        <span className="text-[10px] uppercase tracking-[0.15em] text-[#9b7740] font-semibold">
          {sectionLabel.toUpperCase()}
        </span>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* NAME */}

        <div>

          <label className="block text-[11px] font-medium uppercase text-neutral-500 mb-1">
            Album Name *
          </label>

          <input
            type="text"
            placeholder="e.g. Rohan & Ananya"
            value={
              newAlbum.name
            }
            onChange={(e) =>
              setNewAlbum({
                ...newAlbum,
                name:
                  e.target.value,
              })
            }
            className="w-full text-xs border border-neutral-200 rounded px-3 py-2 bg-white"
          />

        </div>

        {/* SLUG */}

        <div>

          <label className="block text-[11px] font-medium uppercase text-neutral-500 mb-1">
            Slug *
          </label>

          <input
            type="text"
            placeholder="e.g. rohan-ananya"
            value={
              newAlbum.slug
            }
            onChange={(e) =>
              setNewAlbum({
                ...newAlbum,
                slug:
                  e.target.value,
              })
            }
            className="w-full text-xs border border-neutral-200 rounded px-3 py-2 bg-white"
          />

        </div>

        {/* LOCATION */}

        <div>

          <label className="block text-[11px] font-medium uppercase text-neutral-500 mb-1">
            City / Location
          </label>

          <input
            type="text"
            placeholder="e.g. Udaipur, India"
            value={
              newAlbum.location
            }
            onChange={(e) =>
              setNewAlbum({
                ...newAlbum,
                location:
                  e.target.value,
              })
            }
            className="w-full text-xs border border-neutral-200 rounded px-3 py-2 bg-white"
          />

        </div>

      </div>

      <div className="mt-4 flex justify-end gap-2">

        <button
          onClick={
            onCancel
          }
          className="px-5 py-2 border border-neutral-200 bg-white text-neutral-600 rounded text-xs uppercase tracking-[0.15em] font-medium hover:bg-neutral-50"
        >
          Cancel
        </button>

        <button
          onClick={
            onConfirm
          }
          className="px-5 py-2 bg-[#9b7740] hover:bg-[#856535] text-white rounded text-xs uppercase tracking-[0.15em] font-medium"
        >
          Confirm Album
        </button>

      </div>

      <p className="text-[11px] text-neutral-400 mt-3 text-right">
        New album will be persisted when you click{" "}
        <strong>
          Save Changes
        </strong>
        .
      </p>

    </div>
  );
}

/* ===========================================================
   EMPTY STATE
=========================================================== */

function EmptyAlbumState({
  title,
  description,
  onAdd,
  disabled,
}: { title: string; description: string; onAdd: () => void; disabled?: boolean }) {
  return (
    <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50/50">

      <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />

      <p className="text-xs text-neutral-500 font-medium">
        {title}
      </p>

      <p className="text-[11px] text-neutral-400 mt-1">
        {description}
      </p>

      <button
        onClick={onAdd}
        disabled={disabled}
        className={`mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs uppercase tracking-[0.12em] font-medium ${
          disabled
            ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
            : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Album
      </button>

    </div>
  );
}