import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { useGalleryImages } from "../hooks/useQueries";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"];

export default function GalleryPage() {
  const { data: images, isLoading } = useGalleryImages();

  return (
    <div data-ocid="gallery.page" className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
          Gallery
        </h2>
        <div className="w-12 h-1 bg-secondary mx-auto mt-3 rounded-full" />
        <p className="font-body text-muted-foreground mt-3 text-sm">
          A taste of our ambiance and dishes
        </p>
      </div>

      {isLoading && (
        <div
          data-ocid="gallery.loading_state"
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {SKELETON_KEYS.map((k) => (
            <Skeleton key={k} className="aspect-square rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !images?.length && (
        <div data-ocid="gallery.empty_state" className="text-center py-20">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-display text-xl text-muted-foreground">
            No photos yet
          </p>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Check back soon for photos of our restaurant.
          </p>
        </div>
      )}

      {!isLoading && images && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <motion.div
              key={img.url}
              data-ocid={`gallery.item.${i + 1}`}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group relative rounded-lg overflow-hidden shadow-xs border border-border aspect-square bg-muted"
            >
              <img
                src={img.url}
                alt={img.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white px-3 py-2 text-xs font-body opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.caption}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
