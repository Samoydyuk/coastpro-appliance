'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, User, Phone, Mail, Wrench } from 'lucide-react';
import { Button, Input, Textarea, Select, Card, CardContent } from '@/components/ui';
import { CalendlyEmbed } from '@/components/integrations';
import { services } from '@/data/services';
import { trackFormSubmit, trackBookNowClick } from '@/lib/gtag';

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  appliance: string;
  problem: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  zip: '',
  appliance: '',
  problem: '',
};

const applianceOptions = [
  { value: '', label: 'Select appliance type' },
  ...services.map((service) => ({
    value: service.slug,
    label: service.name.replace(' Repair', ''),
  })),
  { value: 'other', label: 'Other / Not Sure' },
];

export function BookingStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
    if (!formData.appliance) newErrors.appliance = 'Please select an appliance';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      trackFormSubmit('booking_step1');
      trackBookNowClick('booking_form');
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const getApplianceLabel = (value: string) => {
    const option = applianceOptions.find((opt) => opt.value === value);
    return option?.label || value;
  };

  // Step 1: Address Form
  if (step === 1) {
    return (
      <div>
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="w-16 h-1 bg-gray-300 mx-2" />
            <div className="w-10 h-10 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold">
              2
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
            Service Information
          </h2>
          <p className="text-gray-600">
            Please provide your details and service address
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              Contact Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                name="name"
                label="Full Name"
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <Input
                name="email"
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </div>
            <Input
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="(949) 449-1008"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
            />
          </div>

          {/* Service Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Service Address
            </h3>
            <Input
              name="address"
              label="Street Address"
              placeholder="123 Main Street, Apt 4B"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
            />
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                name="city"
                label="City"
                placeholder="Irvine"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                required
              />
              <Input
                name="zip"
                label="ZIP Code"
                placeholder="92618"
                value={formData.zip}
                onChange={handleChange}
                error={errors.zip}
                required
              />
            </div>
          </div>

          {/* Appliance Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-600" />
              Appliance Information
            </h3>
            <Select
              name="appliance"
              label="Appliance Type"
              options={applianceOptions}
              value={formData.appliance}
              onChange={handleChange}
              error={errors.appliance}
              required
            />
            <Textarea
              name="problem"
              label="Describe the Problem (Optional)"
              placeholder="Please describe the issue you're experiencing with your appliance..."
              value={formData.problem}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Continue to Schedule
          </Button>
        </form>
      </div>
    );
  }

  // Step 2: Calendly with Summary
  return (
    <div>
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
            ✓
          </div>
          <div className="w-16 h-1 bg-primary-600 mx-2" />
          <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          Select Appointment Time
        </h2>
        <p className="text-gray-600">
          Choose a convenient time for your service visit
        </p>
      </div>

      {/* Service Summary */}
      <Card className="mb-6 bg-primary-50 border-primary-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary-600" />
                <span className="font-medium">{formData.name}</span>
                <span className="text-gray-500">({formData.phone})</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-600" />
                <span>{formData.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                <span>{formData.address}, {formData.city}, CA {formData.zip}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary-600" />
                <span>{getApplianceLabel(formData.appliance)}</span>
                {formData.problem && (
                  <span className="text-gray-500">- {formData.problem.slice(0, 50)}...</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendly Widget */}
      <CalendlyEmbed
        url="https://calendly.com/samoydyuk88/30min"
        prefill={{
          name: formData.name,
          email: formData.email,
          customAnswers: {
            a1: `${formData.address}, ${formData.city}, CA ${formData.zip}`, // Service Address
            a2: formData.phone, // Phone Number
            a3: getApplianceLabel(formData.appliance), // Appliance Type
            a4: formData.problem || 'N/A', // Problem Description
          },
        }}
      />

      {/* Back Button */}
      <div className="mt-6 text-center">
        <Button
          variant="outline"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Service Details
        </Button>
      </div>
    </div>
  );
}
