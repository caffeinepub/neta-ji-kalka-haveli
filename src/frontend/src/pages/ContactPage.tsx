import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone as PhoneIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useSubmitContactMessage } from "../hooks/useQueries";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useSubmitContactMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    mutation.mutate(
      { name, phone, message },
      {
        onSuccess: () => {
          setName("");
          setPhone("");
          setMessage("");
        },
      },
    );
  };

  return (
    <div data-ocid="contact.page" className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
          Contact Us
        </h2>
        <div className="w-12 h-1 bg-secondary mx-auto mt-3 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Info Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
            <h3 className="font-display text-xl font-semibold text-primary mb-4">
              Visit Us
            </h3>
            <div className="space-y-4 font-body">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Address</p>
                  <p className="text-muted-foreground text-sm">
                    NH77, Kalka, Haryana
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Near Kalka Railway Station
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Visiting Hours
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Daily: 7:00 AM – 10:00 PM
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Breakfast, Lunch & Dinner
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Phone</p>
                  <p className="text-muted-foreground text-sm">
                    Ask staff for contact details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
            <h3 className="font-display text-xl font-semibold text-primary mb-4">
              Send a Message
            </h3>

            {mutation.isSuccess && (
              <div
                data-ocid="contact.success_state"
                className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3 mb-4 font-body text-sm"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Thank you! Your message has been sent. We'll get back to you
                soon.
              </div>
            )}

            {mutation.isError && (
              <div
                data-ocid="contact.error_state"
                className="flex items-center gap-2 text-destructive bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 font-body text-sm"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Something went wrong. Please try again.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="contact-name"
                  className="font-body text-sm font-medium"
                >
                  Your Name
                </Label>
                <Input
                  id="contact-name"
                  data-ocid="contact.name.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1 font-body"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="contact-phone"
                  className="font-body text-sm font-medium"
                >
                  Phone Number
                </Label>
                <Input
                  id="contact-phone"
                  data-ocid="contact.phone.input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="mt-1 font-body"
                  required
                  type="tel"
                />
              </div>
              <div>
                <Label
                  htmlFor="contact-message"
                  className="font-body text-sm font-medium"
                >
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  data-ocid="contact.message.textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here…"
                  className="mt-1 font-body min-h-[100px]"
                  required
                />
              </div>
              <Button
                type="submit"
                data-ocid="contact.submit_button"
                disabled={mutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold"
              >
                {mutation.isPending ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
