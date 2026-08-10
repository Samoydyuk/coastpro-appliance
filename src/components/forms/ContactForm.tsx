'use client';

import { useState } from 'react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { services } from '@/data/services';
import { siteConfig } from '@/data/site-config';
import { Send, CheckCircle } from 'lucide-react';
import { trackFormSubmit } from '@/lib/gtag';

const serviceOptions = [
  { value: '', label: 'Select a service' },
  ...services.map((service) => ({
    value: service.slug,
    label: service.name,
  })),
  { value: 'other', label: 'Other / Not Sure' },
];

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      service: formData.get('service') as string,
      message: formData.get('message') as string,
    };

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email address';
    if (!data.phone.trim()) newErrors.phone = 'Phone is required';
    if (!data.service) newErrors.service = 'Please select a service';
    if (!data.message.trim()) newErrors.message = 'Message is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        trackFormSubmit('contact_form');
        setIsSubmitted(true);
      } else {
        // Surface the server's own wording — it names the phone number to
        // call, which matters more than a generic failure notice.
        const body = await response.json().catch(() => null);
        throw new Error(body?.error);
      }
    } catch (error) {
      setErrors({
        form:
          error instanceof Error && error.message
            ? error.message
            : `We couldn't send your message. Please call us at ${siteConfig.contact.phone}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="icon-disc w-16 h-16 mx-auto mb-6 border-ink text-ink">
          <CheckCircle className="h-7 w-7" strokeWidth={1.25} />
        </div>
        <h3 className="headline text-2xl mb-3">Message sent.</h3>
        <p className="text-gray-600 mb-6">
          Thank you for contacting us. We&apos;ll get back to you within 1-2 hours during business hours.
        </p>
        <Button onClick={() => setIsSubmitted(false)} variant="outline">
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="p-4 border border-red-800/40 rounded-card text-red-800">
          {errors.form}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          name="name"
          label="Full Name"
          placeholder="John Smith"
          required
          error={errors.name}
        />
        <Input
          name="email"
          label="Email Address"
          type="email"
          placeholder="john@example.com"
          required
          error={errors.email}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Input
          name="phone"
          label="Phone Number"
          type="tel"
          placeholder="(949) 749-0006"
          required
          error={errors.phone}
        />
        <Select
          name="service"
          label="Service Needed"
          options={serviceOptions}
          placeholder="Select a service"
          required
          error={errors.service}
        />
      </div>

      <Textarea
        name="message"
        label="Describe Your Issue"
        placeholder="Please describe the problem you're experiencing with your appliance..."
        rows={5}
        required
        error={errors.message}
      />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        leftIcon={<Send className="h-5 w-5" />}
      >
        Send Message
      </Button>

      <p className="text-sm text-gray-600 text-center">
        We typically respond within 1-2 hours during business hours.
      </p>
    </form>
  );
}
