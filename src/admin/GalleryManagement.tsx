import {
  useCallback,
  useEffect,
  useMemo,
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

import { uploadToCloudinary } from "../services/cloudinary";
import type { GalleryCouple, GalleryPhoto } from "../types";

interface GalleryAdminAlbum extends GalleryCouple {
  id: string;
  slug: string;
  name: string;
  location: string;
  image: string;
  order: number;
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

type GallerySection = "couples" | "recentAlbums";

interface GalleryApiResponse {
  success?: boolean;
  message?: string;
  content?: { gallery?: Partial<GalleryHeader> & { couples?: unknown; recentAlbums?: unknown }; [key: string]: unknown };
  gallery?: { albums?: unknown; recentAlbums?: unknown; header?: Partial<GalleryHeader>; album?: GalleryAdminAlbum; recentBySlug?: Record<string, AdminGalleryPhoto[]>; bySlug?: Record<string, AdminGalleryPhoto[]> };
  galleryBySlug?: Record<string, AdminGalleryPhoto[]>;
  photos?: AdminGalleryPhoto[];
  album?: GalleryAdminAlbum;
  [key: string]: unknown;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const MAX_CARDS = 16;
const MAX_COUPLES_CARDS = 12;
const MAX_RECENT_CARDS = 4;
const MAX_PHOTOS = 40;

const DEFAULT_COUPLES: GalleryAdminAlbum[] = [
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

const DEFAULT_RECENT_ALBUMS: GalleryAdminAlbum[] = [];

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
     PHOTO GALLERY ALBUMS
  ========================================================= */

  const [albums, setAlbums] = useState<GalleryAdminAlbum[]>(DEFAULT_COUPLES);

  const [originalAlbums, setOriginalAlbums] = useState<GalleryAdminAlbum[]>(DEFAULT_COUPLES);

  /* =========================================================
     RECENT ALBUMS
  ========================================================= */

  const [recentAlbums, setRecentAlbums] = useState<GalleryAdminAlbum[]>(DEFAULT_RECENT_ALBUMS);

  const [originalRecentAlbums, setOriginalRecentAlbums] = useState<GalleryAdminAlbum[]>(DEFAULT_RECENT_ALBUMS);

  /* =========================================================
     MEDIA STATE
  ========================================================= */

  // {
  //   [slug]: Photo[]
  // }
  const [albumPhotos, setAlbumPhotos] = useState<Record<string, AdminGalleryPhoto[]>>({});

  const [recentAlbumPhotos, setRecentAlbumPhotos] = useState<Record<string, AdminGalleryPhoto[]>>({});

  const [loadingAlbumPhotos, setLoadingAlbumPhotos] = useState<Record<string, boolean>>({});

  const [loadingRecentAlbumPhotos, setLoadingRecentAlbumPhotos] = useState<Record<string, boolean>>({});

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

  /* =========================================================
     ADD ALBUM STATE
  ========================================================= */

  const [newAlbum, setNewAlbum] = useState<Pick<GalleryAdminAlbum, "name" | "slug" | "location" | "image">>({
      name: "",
      slug: "",
      location: "",
      image: "",
    });

  const [newAlbumSection, setNewAlbumSection] = useState<GallerySection>("couples");

  const [showAddAlbum, setShowAddAlbum] =
    useState(false);

  /* =========================================================
     CARD COUNT
  ========================================================= */

  const totalCards =
    albums.length + recentAlbums.length;

  const remainingCards =
    Math.max(0, MAX_CARDS - totalCards);

  /* =========================================================
     CHANGE DETECTION
  ========================================================= */

  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(header) !==
        JSON.stringify(originalHeader) ||
      JSON.stringify(albums) !==
        JSON.stringify(originalAlbums) ||
      JSON.stringify(recentAlbums) !==
        JSON.stringify(originalRecentAlbums)
    );
  }, [
    header,
    originalHeader,
    albums,
    originalAlbums,
    recentAlbums,
    originalRecentAlbums,
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
        `${API_BASE_URL}/api/content.php`
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

      const loadedAlbums =
        normalizeAlbums(
          gallery.couples
        );

      const loadedRecentAlbums =
        normalizeAlbums(
          gallery.recentAlbums
        );

      setHeader(loadedHeader);
      setOriginalHeader(
        deepClone(loadedHeader)
      );

      setAlbums(
        loadedAlbums.length
          ? loadedAlbums
          : []
      );

      setOriginalAlbums(
        deepClone(
          loadedAlbums.length
            ? loadedAlbums
            : []
        )
      );

      setRecentAlbums(
        loadedRecentAlbums
      );

      setOriginalRecentAlbums(
        deepClone(
          loadedRecentAlbums
        )
      );

      /* -----------------------------------------------------
         GALLERY MEDIA
      ----------------------------------------------------- */

      const galleryRes = await fetch(
        `${API_BASE_URL}/api/gallery.php?include_inactive=1`
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
       * galleryBySlug contains normal
       * Photo Gallery albums.
       */

      if (
        galleryData.galleryBySlug &&
        typeof galleryData.galleryBySlug ===
          "object"
      ) {
        setAlbumPhotos(
          galleryData.galleryBySlug as Record<string, AdminGalleryPhoto[]>
        );
      } else {
        setAlbumPhotos({});
      }

      /*
       * recentBySlug contains Recent albums.
       */

      if (
        galleryData.recentBySlug &&
        typeof galleryData.recentBySlug ===
          "object"
      ) {
        setRecentAlbumPhotos(
          galleryData.recentBySlug as Record<string, AdminGalleryPhoto[]>
        );
      } else {
        setRecentAlbumPhotos({});
      }
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
    section: GallerySection = "couples"
  ) => {
    if (!slug) return;

    const isRecent =
      section === "recentAlbums";

    try {
      if (isRecent) {
        setLoadingRecentAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]: true,
          })
        );
      } else {
        setLoadingAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]: true,
          })
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/gallery.php?slug=${encodeURIComponent(
          slug
        )}`
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

      if (isRecent) {
        setRecentAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]: photos,
          })
        );
      } else {
        setAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]: photos,
          })
        );
      }
    } catch (error: unknown) {
      console.error(
        `Failed to load photos for ${slug}:`,
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to load album photos."
      );
    } finally {
      if (isRecent) {
        setLoadingRecentAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]: false,
          })
        );
      } else {
        setLoadingAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]: false,
          })
        );
      }
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
    if (section === "couples" && albums.length >= MAX_COUPLES_CARDS) {
      alert(
        `Maximum ${MAX_COUPLES_CARDS} Photo Gallery cards are allowed.`
      );
      return;
    }

    if (section === "recentAlbums" && recentAlbums.length >= MAX_RECENT_CARDS) {
      alert(
        `Maximum ${MAX_RECENT_CARDS} Recent cards are allowed.`
      );
      return;
    }

    if (totalCards >= MAX_CARDS) {
      alert(
        `Maximum ${MAX_CARDS} cards are allowed in Gallery + Recent combined.`
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
    if (newAlbumSection === "couples" && albums.length >= MAX_COUPLES_CARDS) {
      alert(
        `Maximum ${MAX_COUPLES_CARDS} Photo Gallery cards are allowed.`
      );
      return;
    }

    if (newAlbumSection === "recentAlbums" && recentAlbums.length >= MAX_RECENT_CARDS) {
      alert(
        `Maximum ${MAX_RECENT_CARDS} Recent cards are allowed.`
      );
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

    const allAlbums = [
      ...albums,
      ...recentAlbums,
    ];

    const duplicate =
      allAlbums.some(
        (album) =>
          album.slug.toLowerCase() ===
          generatedSlug.toLowerCase()
      );

    if (duplicate) {
      alert(
        "An album with this slug already exists. Slug must be unique across Photo Gallery and Recent."
      );
      return;
    }

    const targetList =
      newAlbumSection ===
      "recentAlbums"
        ? recentAlbums
        : albums;

    const created = {
      id: `album-${Date.now()}`,
      slug: generatedSlug,
      name,
      location:
        newAlbum.location.trim(),
      image:
        newAlbum.image || "",
      order: targetList.length,
    };

    if (
      newAlbumSection ===
      "recentAlbums"
    ) {
      setRecentAlbums(
        (prev) => [
          ...prev,
          created,
        ]
      );
    } else {
      setAlbums(
        (prev) => [
          ...prev,
          created,
        ]
      );
    }

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
    if (
      section ===
      "recentAlbums"
    ) {
      setRecentAlbums(
        (prev) => {
          const updated = [
            ...prev,
          ];

          updated[index] = {
            ...updated[index],
            [field]:
              field === "slug"
                ? createSlug(value)
                : value,
          };

          return updated;
        }
      );
    } else {
      setAlbums(
        (prev) => {
          const updated = [
            ...prev,
          ];

          updated[index] = {
            ...updated[index],
            [field]:
              field === "slug"
                ? createSlug(value)
                : value,
          };

          return updated;
        }
      );
    }

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
    const source =
      section === "recentAlbums"
        ? recentAlbums
        : albums;

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

    if (
      section ===
      "recentAlbums"
    ) {
      setRecentAlbums(
        normalized
      );
    } else {
      setAlbums(
        normalized
      );
    }

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
    const source =
      section === "recentAlbums"
        ? recentAlbums
        : albums;

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
        (
          section ===
          "recentAlbums"
            ? originalRecentAlbums
            : originalAlbums
        ).some(
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

      if (
        section ===
        "recentAlbums"
      ) {
        setRecentAlbums(
          (prev) =>
            prev
              .filter(
                (_, i) =>
                  i !== index
              )
              .map(
                (item, i) => ({
                  ...item,
                  order: i,
                })
              )
        );

        setRecentAlbumPhotos(
          (prev) => {
            const next = {
              ...prev,
            };

            delete next[
              album.slug
            ];

            return next;
          }
        );
      } else {
        setAlbums(
          (prev) =>
            prev
              .filter(
                (_, i) =>
                  i !== index
              )
              .map(
                (item, i) => ({
                  ...item,
                  order: i,
                })
              )
        );

        setAlbumPhotos(
          (prev) => {
            const next = {
              ...prev,
            };

            delete next[
              album.slug
            ];

            return next;
          }
        );
      }

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

  const handleUploadAlbumPhotos = async (
    section: GallerySection,
    slug: string,
    fileList: FileList | null
  ) => {
    if (
      !fileList ||
      fileList.length === 0
    ) {
      return;
    }

    const isRecent =
      section ===
      "recentAlbums";

    const currentPhotos =
      isRecent
        ? recentAlbumPhotos[slug] || []
        : albumPhotos[slug] || [];

    const currentCount =
      currentPhotos.length;

    const remaining =
      MAX_PHOTOS -
      currentCount;

    if (remaining <= 0) {
      alert(
        `This album already has ${MAX_PHOTOS}/${MAX_PHOTOS} photos. Delete a photo before uploading another.`
      );
      return;
    }

    const selectedFiles: File[] = Array.from(fileList);

    if (
      selectedFiles.length >
      remaining
    ) {
      alert(
        `This album already has ${currentCount}/${MAX_PHOTOS} photos.\n\nYou selected ${selectedFiles.length} photos, but only ${remaining} slot${
          remaining === 1
            ? ""
            : "s"
        } remaining.\n\nOnly ${remaining} photo${
          remaining === 1
            ? ""
            : "s"
        } will be uploaded.`
      );
    }

    const filesToUpload =
      selectedFiles.slice(
        0,
        remaining
      );

    const key =
      `photos-${section}-${slug}`;

    const categoryPrefix =
      isRecent
        ? "recent"
        : "gallery";

    const category =
      `${categoryPrefix}:${slug}`;

    const folder =
      `san-photography/gallery/${isRecent ? "recent" : slug}`;

    try {
      setUploadingState(
        (prev) => ({
          ...prev,
          [key]: true,
        })
      );

      setErrMsg("");

      const itemsToInsert = [];

      /*
       * Sequential Cloudinary upload.
       * Prevents browser/network overload.
       */

      for (
        let i = 0;
        i < filesToUpload.length;
        i++
      ) {
        const file =
          filesToUpload[i];

        try {
          const result =
            await uploadToCloudinary(
              file,
              folder
            );

          if (!result?.url) {
            throw new Error(
              `Cloudinary upload failed for ${file.name}`
            );
          }

          itemsToInsert.push({
            category,

            title:
              getFileTitle(file),

            imageUrl:
              result.url,

            publicId:
              result.publicId || "",

            resourceType:
              result.resourceType ||
              "image",

            format:
              result.format || "",

            width:
              result.width || null,

            height:
              result.height || null,

            bytes:
              result.bytes || null,

            folder,

            order:
              currentCount +
              itemsToInsert.length,

            isActive: true,
          });
        } catch (uploadError: unknown) {
          console.error(
            `Failed uploading ${file.name}:`,
            uploadError
          );

          throw new Error(
            `Failed to upload "${file.name}". ${uploadError instanceof Error ? uploadError.message : "Unknown upload error"}`
          );
        }
      }

      if (
        itemsToInsert.length ===
        0
      ) {
        return;
      }

      /*
       * Save uploaded media to MySQL.
       */

      const response =
        await fetch(
          `${API_BASE_URL}/api/gallery.php`,
          {
            method: "POST",
            headers:
              authenticatedJsonHeaders(),

            body: JSON.stringify({
              items:
                itemsToInsert,
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
            "Photos uploaded to Cloudinary but could not be saved in MySQL."
        );
      }

      /*
       * Reload from MySQL.
       */

      await fetchAlbumPhotos(
        slug,
        section
      );

      setSaveMsg(
        `${itemsToInsert.length} photo${
          itemsToInsert.length ===
          1
            ? ""
            : "s"
        } added successfully.`
      );
    } catch (error: unknown) {
      console.error(
        "Album photo upload error:",
        error
      );

      setErrMsg(
        error instanceof Error ? error.message : "Failed to upload album photos."
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
     MOVE PHOTO
  ========================================================= */

  const handleMoveAlbumPhoto =
    async (
      section: GallerySection,
      slug: string,
      photoIndex: number,
      direction: number
    ) => {
      const isRecent =
        section ===
        "recentAlbums";

      const list =
        isRecent
          ? recentAlbumPhotos[
              slug
            ] || []
          : albumPhotos[
              slug
            ] || [];

      const target =
        photoIndex +
        direction;

      if (
        target < 0 ||
        target >= list.length
      ) {
        return;
      }

      const copy = [
        ...list,
      ];

      const temp =
        copy[photoIndex];

      copy[photoIndex] =
        copy[target];

      copy[target] =
        temp;

      const reordered =
        copy.map(
          (photo, index) => ({
            ...photo,
            order: index,
          })
        );

      if (isRecent) {
        setRecentAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]:
              reordered,
          })
        );
      } else {
        setAlbumPhotos(
          (prev) => ({
            ...prev,
            [slug]:
              reordered,
          })
        );
      }

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

      const isRecent =
        section ===
        "recentAlbums";

      const folder =
        `san-photography/gallery/${isRecent ? "recent" : slug}`;

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

      const allAlbums = [
        ...albums,
        ...recentAlbums,
      ];

      /* -----------------------------------------------------
         TOTAL CARD LIMIT
      ----------------------------------------------------- */

      if (
        allAlbums.length >
        MAX_CARDS
      ) {
        throw new Error(
          `Maximum ${MAX_CARDS} Gallery + Recent cards are allowed.`
        );
      }

      /* -----------------------------------------------------
         NORMALIZE PHOTO GALLERY
      ----------------------------------------------------- */

      const normalizedAlbums =
        albums.map(
          (album, index) => ({
            ...album,

            id: String(
              album.id ||
                `album-${index}`
            ),

            slug: createSlug(
              album.slug
            ),

            name:
              album.name.trim(),

            location:
              album.location?.trim() ||
              "",

            image:
              album.image || "",

            order: index,
          })
        );

      /* -----------------------------------------------------
         NORMALIZE RECENT ALBUMS
      ----------------------------------------------------- */

      const normalizedRecentAlbums =
        recentAlbums.map(
          (album, index) => ({
            ...album,

            id: String(
              album.id ||
                `recent-${index}`
            ),

            slug: createSlug(
              album.slug
            ),

            name:
              album.name.trim(),

            location:
              album.location?.trim() ||
              "",

            image:
              album.image || "",

            order: index,
          })
        );

      /* -----------------------------------------------------
         VALIDATE
      ----------------------------------------------------- */

      for (
        const album of [
          ...normalizedAlbums,
          ...normalizedRecentAlbums,
        ]
      ) {
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

      for (
        const album of [
          ...normalizedAlbums,
          ...normalizedRecentAlbums,
        ]
      ) {
        if (
          slugSet.has(
            album.slug
          )
        ) {
          throw new Error(
            `Duplicate slug "${album.slug}". Slugs must be unique across Photo Gallery and Recent.`
          );
        }

        slugSet.add(
          album.slug
        );
      }

      /* -----------------------------------------------------
         HANDLE EXISTING ALBUM SLUG CHANGES
      ----------------------------------------------------- */

      const existingSections = [
        {
          current:
            normalizedAlbums,
          original:
            originalAlbums,
          section:
            "couples",
        },
        {
          current:
            normalizedRecentAlbums,
          original:
            originalRecentAlbums,
          section:
            "recentAlbums",
        },
      ];

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

            if (
              group.section ===
              "recentAlbums"
            ) {
              setRecentAlbumPhotos(
                (prev) => {
                  const next = {
                    ...prev,
                  };

                  if (
                    next[
                      previousAlbum.slug
                    ]
                  ) {
                    next[
                      nextAlbum.slug
                    ] =
                      next[
                        previousAlbum.slug
                      ];

                    delete next[
                      previousAlbum.slug
                    ];
                  }

                  return next;
                }
              );
            } else {
              setAlbumPhotos(
                (prev) => {
                  const next = {
                    ...prev,
                  };

                  if (
                    next[
                      previousAlbum.slug
                    ]
                  ) {
                    next[
                      nextAlbum.slug
                    ] =
                      next[
                        previousAlbum.slug
                      ];

                    delete next[
                      previousAlbum.slug
                    ];
                  }

                  return next;
                }
              );
            }
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

                  couples:
                    normalizedAlbums,

                  recentAlbums:
                    normalizedRecentAlbums,
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
    const isRecent =
      section ===
      "recentAlbums";

    const photos =
      isRecent
        ? recentAlbumPhotos[
            slug
          ] || []
        : albumPhotos[
            slug
          ] || [];

    const isLoading =
      isRecent
        ? loadingRecentAlbumPhotos[
            slug
          ]
        : loadingAlbumPhotos[
            slug
          ];

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
                {isRecent
                  ? `recent:${slug}`
                  : `gallery:${slug}`}
              </code>
            </p>
          </div>

          <label
            className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-medium uppercase tracking-[0.15em] shadow-sm ${
              remaining <= 0
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                : isUploading
                ? "bg-neutral-400 text-white cursor-wait"
                : "bg-[#9b7740] hover:bg-[#856535] text-white cursor-pointer"
            }`}
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}

            <span>
              {isUploading
                ? "Uploading..."
                : remaining <= 0
                ? "Album Full"
                : "Add Photos"}
            </span>

            {remaining > 0 &&
              !isUploading && (
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={
                    isUploading
                  }
                  onChange={(e) => {
                    handleUploadAlbumPhotos(
                      section,
                      slug,
                      e.target.files
                    );

                    e.target.value =
                      "";
                  }}
                />
              )}
          </label>
        </div>

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
              Upload photos in multiple batches until you reach 40.
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
                  className="group relative bg-white rounded border border-neutral-200 overflow-hidden shadow-xs"
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
                          accept="image/*"
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
    const isRecent =
      section ===
      "recentAlbums";

    const expandedKey =
      `${section}:${album.slug}`;

    const isExpanded =
      expandedAlbumKey ===
      expandedKey;

    const photos =
      isRecent
        ? recentAlbumPhotos[
            album.slug
          ] || []
        : albumPhotos[
            album.slug
          ] || [];

    const photoCount =
      photos.length;

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
                index ===
                (
                  isRecent
                    ? recentAlbums
                    : albums
                ).length -
                  1
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
              Photo Gallery + Recent Albums • Maximum {MAX_CARDS} cards • {MAX_PHOTOS} photos per card
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
                Photo Gallery Albums ({albums.length})
              </h2>

              <p className="text-xs text-neutral-400 mt-1">
                {albums.length} Photo Gallery card
                {albums.length === 1
                  ? ""
                  : "s"} • Maximum {MAX_PHOTOS} photos per album.
              </p>

            </div>

            <button
              onClick={() =>
                openAddAlbum(
                  "couples"
                )
              }
              disabled={
                albums.length >= MAX_COUPLES_CARDS ||
                totalCards >= MAX_CARDS
              }
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs uppercase tracking-[0.15em] font-medium self-start sm:self-auto ${
                albums.length >= MAX_COUPLES_CARDS ||
                totalCards >= MAX_CARDS
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
                Photo Gallery + Recent combined
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
              "couples" && (
              <AddAlbumForm
                section="couples"
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

            {albums.length ===
            0 ? (
              <EmptyAlbumState
                title="No Photo Gallery albums"
                description="Create your first Photo Gallery album."
                onAdd={() =>
                  openAddAlbum(
                    "couples"
                  )
                }
                disabled={
                  totalCards >=
                  MAX_CARDS
                }
              />
            ) : (
              albums.map(
                (
                  album,
                  index
                ) =>
                  renderAlbumCard({
                    album,
                    index,
                    section:
                      "couples",
                  })
              )
            )}

          </div>

        </section>

        {/* ===================================================
            SECTION 03 — RECENT ALBUMS
        =================================================== */}

        <section className="bg-white rounded-xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm">

          <div className="border-b border-neutral-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9b7740]">
                SECTION 03
              </span>

              <h2 className="text-xl font-normal text-neutral-800 tracking-tight mt-0.5">
                Recent Albums ({recentAlbums.length})
              </h2>

              <p className="text-xs text-neutral-400 mt-1">
                Recent works are also managed as albums/cards. Each Recent card supports up to {MAX_PHOTOS} photos.
              </p>

            </div>

            <button
              onClick={() =>
                openAddAlbum(
                  "recentAlbums"
                )
              }
              disabled={
                recentAlbums.length >= MAX_RECENT_CARDS ||
                totalCards >= MAX_CARDS
              }
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs uppercase tracking-[0.15em] font-medium self-start sm:self-auto ${
                recentAlbums.length >= MAX_RECENT_CARDS ||
                totalCards >= MAX_CARDS
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-neutral-900 text-white hover:bg-neutral-800"
              }`}
            >

              <Plus className="w-3.5 h-3.5" />

              Add Recent Album

            </button>

          </div>

          {/* ADD RECENT */}

          {showAddAlbum &&
            newAlbumSection ===
              "recentAlbums" && (
              <AddAlbumForm
                section="recentAlbums"
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

            {recentAlbums.length ===
            0 ? (
              <EmptyAlbumState
                title="No Recent albums"
                description="Create a Recent album and upload its photos progressively."
                onAdd={() =>
                  openAddAlbum(
                    "recentAlbums"
                  )
                }
                disabled={
                  totalCards >=
                  MAX_CARDS
                }
              />
            ) : (
              recentAlbums.map(
                (
                  album,
                  index
                ) =>
                  renderAlbumCard({
                    album,
                    index,
                    section:
                      "recentAlbums",
                  })
              )
            )}

          </div>

        </section>

        {/* ===================================================
            SECTION 04 — CTA
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
              SECTION 05 — PERSISTENCE
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
              Photo Gallery: {albums.length}
              {" • "}
              Recent: {recentAlbums.length}
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
  const isRecent =
    section ===
    "recentAlbums";

  return (
    <div className="mb-8 p-5 bg-[#faf8f5] border border-[#e8dfd1] rounded-lg">

      <div className="flex items-center justify-between mb-4">

        <div>

          <h3 className="text-sm font-semibold text-neutral-800 uppercase tracking-[0.1em]">
            Create New{" "}
            {isRecent
              ? "Recent Album"
              : "Photo Gallery Album"}
          </h3>

          <p className="text-[11px] text-neutral-400 mt-1">
            Cover image is optional and is separate from the 40-photo album limit.
          </p>

        </div>

        <span className="text-[10px] uppercase tracking-[0.15em] text-[#9b7740] font-semibold">
          {isRecent
            ? "RECENT"
            : "PHOTO GALLERY"}
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