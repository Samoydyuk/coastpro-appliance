'use client';

import { useState } from 'react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { services } from '@/data/services';
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
        throw new Error('Failed to send message');
      }
    } catch {
      setErrors({ form: 'Failed to send message. Please try again or call us directly.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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

      <p className="text-sm text-gray-500 text-center">
        We typically respond within 1-2 hours during business hours.
      </p>
    </form>
  );
}
