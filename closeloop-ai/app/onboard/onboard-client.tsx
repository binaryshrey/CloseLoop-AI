"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileMenu from "@/components/profile-menu";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperTitle,
  StepperTrigger,
  StepperContent,
  StepperPanel,
} from "@/components/ui/stepper";
import { Check, ChevronRight, ChevronLeft, Megaphone, Users, Target, Mail, Phone, Plus, Trash2, Info, Send, Loader2 } from "lucide-react";

const steps = [
  { title: "Create Campaign", description: "Set up your campaign details", slug: "create-campaign", icon: Megaphone },
  { title: "Source Leads", description: "Define where to find your leads", slug: "source-leads", icon: Users },
  { title: "Select Leads", description: "Choose your target audience", slug: "select-leads", icon: Target },
  { title: "Outreach - Email", description: "Configure email outreach", slug: "outreach-email", icon: Mail },
  { title: "Outreach - Call", description: "Set up call strategy", slug: "outreach-call", icon: Phone },
];

interface OnboardClientProps {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    profilePictureUrl?: string | null;
  };
}

export default function OnboardClient({ user }: OnboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(1);
  const [leadSource, setLeadSource] = useState("Upload CSV");
  const [manualLeads, setManualLeads] = useState([
    { id: 1, name: "", about: "", linkedin: "", twitter: "" },
  ]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);

  // Campaign data state
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("Lead Generation");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productAboutUrl, setProductAboutUrl] = useState("");
  const [productPricingUrl, setProductPricingUrl] = useState("");

  // Email state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [suggestedLeads] = useState([
    {
      id: 1,
      name: "Sarah Chen",
      about: "VP of Engineering at TechCorp",
      email: "sarah.chen@techcorp.com",
      linkedin: "linkedin.com/in/sarahchen",
      phone: "+1 (555) 123-4567",
      fScore: 92,
      reason: "High engagement rate, matches target industry, decision maker role",
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      about: "Senior Product Manager at InnovateLabs",
      email: "m.rodriguez@innovatelabs.io",
      linkedin: "linkedin.com/in/michaelrodriguez",
      phone: "+1 (555) 234-5678",
      fScore: 88,
      reason: "Previously engaged with similar campaigns, active on LinkedIn",
    },
    {
      id: 3,
      name: "Emily Watson",
      about: "CTO at StartupXYZ",
      email: "emily@startupxyz.com",
      linkedin: "linkedin.com/in/emilywatson",
      phone: "+1 (555) 345-6789",
      fScore: 95,
      reason: "Perfect fit for target persona, recent company growth, high authority",
    },
    {
      id: 4,
      name: "David Kim",
      about: "Head of Sales at SalesPro",
      email: "dkim@salespro.com",
      linkedin: "linkedin.com/in/davidkim",
      phone: "+1 (555) 456-7890",
      fScore: 85,
      reason: "Active buyer signals, matches geographic criteria, budget authority",
    },
    {
      id: 5,
      name: "Jessica Martinez",
      about: "Director of Marketing at BrandBoost",
      email: "jessica.m@brandboost.com",
      linkedin: "linkedin.com/in/jessicamartinez",
      phone: "+1 (555) 567-8901",
      fScore: 90,
      reason: "Strong engagement history, ideal company size, relevant pain points",
    },
  ]);

  // Initialize step from query param
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = steps.findIndex((s) => s.slug === stepParam);
      if (stepIndex !== -1) {
        setActiveStep(stepIndex + 1);
      }
    }
  }, [searchParams]);

  // Update query param when step changes
  useEffect(() => {
    const currentSlug = steps[activeStep - 1]?.slug;
    if (currentSlug) {
      router.replace(`/onboard?step=${currentSlug}`, { scroll: false });
    }
  }, [activeStep, router]);

  const handleNext = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const addManualLead = () => {
    setManualLeads([
      ...manualLeads,
      { id: Date.now(), name: "", about: "", linkedin: "", twitter: "" },
    ]);
  };

  const removeManualLead = (id: number) => {
    if (manualLeads.length > 1) {
      setManualLeads(manualLeads.filter((lead) => lead.id !== id));
    }
  };

  const updateManualLead = (id: number, field: string, value: string) => {
    setManualLeads(
      manualLeads.map((lead) =>
        lead.id === id ? { ...lead, [field]: value } : lead
      )
    );
  };

  const toggleLeadSelection = (id: number) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  // Prefill email subject and body when campaign data changes or when reaching email step
  useEffect(() => {
    if (activeStep === 4 && campaignName && !emailSubject) {
      // Generate email subject
      const subject = `🚀 ${campaignName} - Introducing Our Solution`;
      setEmailSubject(subject);

      // Generate email body with product information
      const body = generateEmailBody();
      setEmailBody(body);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, campaignName, productUrl, productAboutUrl, productPricingUrl]);

  // Generate email body based on campaign data
  const generateEmailBody = () => {
    let body = `Hi {name},\n\n`;
    body += `I hope this message finds you well.\n\n`;

    if (campaignDescription) {
      body += `${campaignDescription}\n\n`;
    }

    body += `I'd like to introduce you to ${campaignName || "our solution"}.\n\n`;

    if (productUrl || productAboutUrl || productPricingUrl) {
      body += `Here are some helpful resources:\n\n`;

      if (productUrl) {
        body += `🔗 Product Overview: ${productUrl}\n`;
      }
      if (productAboutUrl) {
        body += `📖 Learn More: ${productAboutUrl}\n`;
      }
      if (productPricingUrl) {
        body += `💰 Pricing Information: ${productPricingUrl}\n`;
      }
      body += `\n`;
    }

    body += `I believe this could be valuable for you and would love to discuss how it can help.\n\n`;
    body += `Would you be open to a quick chat?\n\n`;
    body += `Best regards,\n`;
    body += `${user.firstName || 'Your'} ${user.lastName || 'Name'}`;

    return body;
  };

  // Send email notification
  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignName,
          campaignDescription,
          productUrl,
          productAboutUrl,
          productPricingUrl,
          emailSubject,
          emailBody,
        }),
      });

      const data = await response.json();
      console.log('Email API response:', data);

      if (response.ok && data.success) {
        setEmailSent(true);
        alert(`✅ Email sent successfully to ${data.recipients.join(', ')}`);
      } else {
        // Show detailed error messages
        let errorMsg = '❌ Failed to send email:\n\n';

        if (data.errors && Array.isArray(data.errors)) {
          errorMsg += data.errors.join('\n');
        } else if (data.error) {
          errorMsg += data.error;
          if (data.details) {
            errorMsg += '\n\nDetails: ' + data.details;
          }
        } else if (data.message) {
          errorMsg += data.message;
        } else {
          errorMsg += 'Unknown error occurred';
        }

        if (data.successes && data.successes > 0) {
          errorMsg += `\n\n✅ ${data.successes} email(s) sent successfully`;
        }

        alert(errorMsg);
        console.error('Email send failed:', data);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Failed to send email. Please check the console for details.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen bg-black">
      {/* Header */}
      <div className="px-6 pt-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <Image
              src="/logodark.svg"
              alt="CloseLoop AI Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-2xl font-bold text-white">CloseLoop AI</span>
          </Link>
          <div className="lg:flex lg:flex-1 lg:justify-end">
            <ProfileMenu user={user} />
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to CloseLoop AI
          </h1>
          <p className="text-gray-400">
            Let's get you set up with your first campaign
          </p>
        </div>

        <Stepper
          value={activeStep}
          onValueChange={setActiveStep}
          className="space-y-8"
          indicators={{
            completed: <Check className="h-4 w-4" />,
          }}
        >
          {/* Stepper Navigation */}
          <StepperNav className="gap-3.5 mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <StepperItem
                  key={index}
                  step={index + 1}
                  className="relative flex-1 items-start"
                >
                  <StepperTrigger className="flex flex-col items-start justify-center gap-3.5 grow">
                    <StepperIndicator className="bg-gray-800 rounded-full h-1 w-full data-[state=active]:bg-blue-500 data-[state=completed]:bg-blue-500"></StepperIndicator>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 group-data-[state=active]/step:bg-blue-500 group-data-[state=completed]/step:bg-blue-500 transition-colors">
                        <Icon className="h-3.5 w-3.5 text-gray-400 group-data-[state=active]/step:text-white group-data-[state=completed]/step:text-white" />
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <StepperTitle className="text-start font-semibold text-white group-data-[state=inactive]/step:text-gray-500">
                          {step.title}
                        </StepperTitle>
                        <p className="text-xs text-gray-500 group-data-[state=active]/step:text-gray-400">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </StepperTrigger>
                </StepperItem>
              );
            })}
          </StepperNav>

          {/* Step Content */}
          <StepperPanel>
            {/* Step 1: Create Campaign */}
            <StepperContent value={1}>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Create Your Campaign
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter campaign name"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Campaign Type
                      </label>
                      <select
                        value={campaignType}
                        onChange={(e) => setCampaignType(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Lead Generation</option>
                        <option>Customer Engagement</option>
                        <option>Product Launch</option>
                        <option>Follow-up Campaign</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Campaign Description
                    </label>
                    <textarea
                      rows={4}
                      value={campaignDescription}
                      onChange={(e) => setCampaignDescription(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your campaign goals"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product URL
                    </label>
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product About URL
                    </label>
                    <input
                      type="url"
                      value={productAboutUrl}
                      onChange={(e) => setProductAboutUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/about"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Pricing URL
                    </label>
                    <input
                      type="url"
                      value={productPricingUrl}
                      onChange={(e) => setProductPricingUrl(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/pricing"
                    />
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 2: Source Leads */}
            <StepperContent value={2}>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Source Your Leads
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lead Source
                    </label>
                    <select
                      value={leadSource}
                      onChange={(e) => setLeadSource(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Upload CSV</option>
                      <option>Manual Entry</option>
                    </select>
                  </div>

                  {leadSource === "Upload CSV" ? (
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors cursor-pointer">
                      <div className="text-gray-400">
                        <p className="text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs mt-1">CSV, Excel (MAX. 10MB)</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                                About
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                                LinkedIn
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                                Twitter
                              </th>
                              <th className="w-12"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {manualLeads.map((lead) => (
                              <tr
                                key={lead.id}
                                className="border-b border-gray-800"
                              >
                                <td className="py-2 px-4">
                                  <input
                                    type="text"
                                    value={lead.name}
                                    onChange={(e) =>
                                      updateManualLead(
                                        lead.id,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="John Doe"
                                  />
                                </td>
                                <td className="py-2 px-4">
                                  <input
                                    type="text"
                                    value={lead.about}
                                    onChange={(e) =>
                                      updateManualLead(
                                        lead.id,
                                        "about",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Software Engineer"
                                  />
                                </td>
                                <td className="py-2 px-4">
                                  <input
                                    type="text"
                                    value={lead.linkedin}
                                    onChange={(e) =>
                                      updateManualLead(
                                        lead.id,
                                        "linkedin",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="linkedin.com/in/..."
                                  />
                                </td>
                                <td className="py-2 px-4">
                                  <input
                                    type="text"
                                    value={lead.twitter}
                                    onChange={(e) =>
                                      updateManualLead(
                                        lead.id,
                                        "twitter",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="@username"
                                  />
                                </td>
                                <td className="py-2 px-4">
                                  <button
                                    onClick={() => removeManualLead(lead.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        onClick={addManualLead}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add Row
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lead Enrichment
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enrichment"
                        className="w-4 h-4 bg-gray-800 border-gray-700 rounded"
                      />
                      <label
                        htmlFor="enrichment"
                        className="text-sm text-gray-300"
                      >
                        Automatically enrich lead data with additional
                        information
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 3: Select Leads */}
            <StepperContent value={3}>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Select Your Target Leads
                </h2>
                <div className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Leads Sourced</p>
                      <p className="text-2xl font-bold text-white">{manualLeads.filter(l => l.name).length}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Matched Leads</p>
                      <p className="text-2xl font-bold text-white">{suggestedLeads.length}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Suggested Leads</p>
                      <p className="text-2xl font-bold text-blue-500">{suggestedLeads.length}</p>
                    </div>
                  </div>

                  {/* Leads Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 w-12">
                            <input
                              type="checkbox"
                              checked={selectedLeads.length === suggestedLeads.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLeads(suggestedLeads.map((l) => l.id));
                                } else {
                                  setSelectedLeads([]);
                                }
                              }}
                              className="w-4 h-4 bg-gray-800 border-gray-700 rounded cursor-pointer"
                            />
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                            Name
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                            About
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                            LinkedIn
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                            Phone Number
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">
                            F-Score
                          </th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {suggestedLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedLeads.includes(lead.id)}
                                onChange={() => toggleLeadSelection(lead.id)}
                                className="w-4 h-4 bg-gray-800 border-gray-700 rounded cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-white font-medium">
                              {lead.name}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {lead.about}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {lead.email}
                            </td>
                            <td className="py-3 px-4 text-sm text-blue-400">
                              <a
                                href={`https://${lead.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {lead.linkedin}
                              </a>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {lead.phone}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  lead.fScore >= 90
                                    ? "bg-green-900/30 text-green-400"
                                    : lead.fScore >= 85
                                    ? "bg-blue-900/30 text-blue-400"
                                    : "bg-yellow-900/30 text-yellow-400"
                                }`}
                              >
                                {lead.fScore}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="group relative">
                                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                <div className="absolute right-0 top-6 w-64 p-3 bg-gray-950 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                  <p className="text-xs text-gray-300">
                                    {lead.reason}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected Count */}
                  {selectedLeads.length > 0 && (
                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-300">
                        {selectedLeads.length} lead{selectedLeads.length !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </StepperContent>

            {/* Step 4: Outreach - Email */}
            <StepperContent value={4}>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Configure Email Outreach
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Body
                    </label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Write your email message..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use variables: {"{"}name{"}"}, {"{"}company{"}"}, {"{"}
                      title{"}"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Send Time
                      </label>
                      <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Immediately</option>
                        <option>Schedule for later</option>
                        <option>Best time per recipient</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Follow-up
                      </label>
                      <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>No follow-up</option>
                        <option>After 3 days</option>
                        <option>After 7 days</option>
                        <option>Custom schedule</option>
                      </select>
                    </div>
                  </div>

                  {/* Send Email Notification Button */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-white mb-2">
                        📧 Campaign Notification
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">
                        Send campaign details with product information to your team via email
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="h-3.5 w-3.5" />
                        <span>Recipients: shreyansh.saurabh0107@gmail.com, binaryshrey@gmail.com</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSendEmail}
                      disabled={isSendingEmail || emailSent || !campaignName}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                        emailSent
                          ? 'bg-green-600 text-white cursor-not-allowed'
                          : isSendingEmail
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : campaignName
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending Email...
                        </>
                      ) : emailSent ? (
                        <>
                          <Check className="h-4 w-4" />
                          Email Sent Successfully
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Campaign Notification
                        </>
                      )}
                    </button>
                    {!campaignName && (
                      <p className="text-xs text-yellow-500 mt-2 text-center">
                        Please enter a campaign name first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 5: Outreach - Call */}
            <StepperContent value={5}>
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Set Up Call Strategy
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Call Script
                    </label>
                    <textarea
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your call script or talking points..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Call Window
                      </label>
                      <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>9 AM - 12 PM</option>
                        <option>12 PM - 3 PM</option>
                        <option>3 PM - 6 PM</option>
                        <option>Custom time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Attempts
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        defaultValue="3"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 bg-gray-800 border-gray-700 rounded"
                      />
                      <span className="text-sm text-gray-300">
                        Leave voicemail if no answer
                      </span>
                    </label>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 mt-6">
                    <h3 className="text-sm font-medium text-white mb-2">
                      Campaign Summary
                    </h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>• Email outreach configured</p>
                      <p>• Call strategy set up</p>
                      <p>• Ready to launch campaign</p>
                    </div>
                  </div>
                </div>
              </div>
            </StepperContent>
          </StepperPanel>
        </Stepper>

        {/* Navigation Buttons */}
        <div className={`flex ${activeStep === 1 ? 'justify-end' : 'justify-between'} mt-8 gap-4`}>
          {activeStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={activeStep === steps.length}
            className={`flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeStep === 1 ? 'w-full' : 'flex-1'
            }`}
          >
            {activeStep === steps.length ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
