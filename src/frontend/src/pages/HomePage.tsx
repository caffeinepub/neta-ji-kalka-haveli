import { Link } from "@tanstack/react-router";
import { Clock, Drumstick, Leaf, MapPin, Star } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    icon: Leaf,
    title: "Pure Veg Delights",
    desc: "From creamy dal makhani to crispy kachori — our vegetarian spread celebrates the richness of Indian flavors.",
    color: "text-green-700",
  },
  {
    icon: Drumstick,
    title: "Non-Veg Specialties",
    desc: "Tender chicken curries, succulent kebabs, and aromatic biryanis cooked to perfection.",
    color: "text-primary",
  },
  {
    icon: Star,
    title: "Highway Legend",
    desc: "A beloved stopover on NH77 for decades. Travelers and locals alike trust us for authentic home-style cooking.",
    color: "text-secondary",
  },
];

export default function HomePage() {
  return (
    <div data-ocid="home.page">
      {/* Hero Section */}
      <section
        className="relative h-[420px] md:h-[520px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-food.dim_1200x600.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <motion.div
          className="relative z-10 text-center px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-secondary font-body text-sm tracking-[0.3em] uppercase mb-3 font-medium">
            Highway 77 · Kalka, Haryana
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight drop-shadow-xl">
            Best Food on NH77
          </h2>
          <p className="text-white/85 font-body mt-4 text-lg max-w-md mx-auto">
            Authentic family recipes served with love since decades
          </p>
          <div className="flex gap-3 mt-8 justify-center flex-wrap">
            <Link
              to="/menu"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold px-6 py-3 rounded-md transition-colors shadow-lg"
            >
              Explore Menu
            </Link>
            <Link
              to="/contact"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-body font-semibold px-6 py-3 rounded-md transition-colors backdrop-blur-sm"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Welcome Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Welcome to Our Table
          </h2>
          <div className="w-16 h-1 bg-secondary mx-auto mb-6 rounded-full" />
          <p className="font-body text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            At Neta Ji (Kalka Haveli), we bring the warmth of home cooking to
            every plate. Whether you're a highway traveler needing a hearty
            break or a local family out for a meal, our kitchen serves both
            vegetarian and non-vegetarian fare crafted from time-honored
            recipes.
          </p>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="bg-muted py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="bg-card rounded-lg p-6 shadow-warm border border-border"
              >
                <f.icon className={`h-8 w-8 mb-3 ${f.color}`} />
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Info bar */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-center text-center">
          <div className="flex items-center gap-3 font-body">
            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Location</p>
              <p className="text-muted-foreground text-sm">
                NH77, Kalka, Haryana
              </p>
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-border" />
          <div className="flex items-center gap-3 font-body">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Hours</p>
              <p className="text-muted-foreground text-sm">
                Open Daily · 7:00 AM – 10:00 PM
              </p>
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-border" />
          <div>
            <Link
              to="/menu"
              className="inline-block bg-primary text-primary-foreground font-body font-semibold px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors"
            >
              View Full Menu →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
