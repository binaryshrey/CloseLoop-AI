"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Papa from "papaparse";
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
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Megaphone,
  Users,
  Target,
  Mail,
  Phone,
  Plus,
  Trash2,
  Info,
  Send,
  Loader2,
  Wand2,
} from "lucide-react";

const steps = [
  {
    title: "Create Campaign",
    description: "Set up your campaign details",
    slug: "create-campaign",
    icon: Megaphone,
  },
  {
    title: "Source Leads",
    description: "Upload your leads details",
    slug: "source-leads",
    icon: Users,
  },
  {
    title: "Select Leads",
    description: "Choose your target audience",
    slug: "select-leads",
    icon: Target,
  },
  {
    title: "Outreach - Email",
    description: "Configure email outreach",
    slug: "outreach-email",
    icon: Mail,
  },
  {
    title: "Outreach - Call",
    description: "Set up call strategy",
    slug: "outreach-call",
    icon: Phone,
  },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [leadSource, setLeadSource] = useState("Upload CSV");
  const [manualLeads, setManualLeads] = useState([
    { id: 1, name: "", about: "", linkedin: "", twitter: "" },
  ]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvLeads, setCsvLeads] = useState<any[]>([]);
  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);
  const [analyzedLeads, setAnalyzedLeads] = useState<any[]>([]);

  // Campaign data state
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("Lead Generation");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productAboutUrl, setProductAboutUrl] = useState("");
  const [productPricingUrl, setProductPricingUrl] = useState("");
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);

  // Email state
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [activeCallLead, setActiveCallLead] = useState<string | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);

  // Initialize step and campaign from query params
  useEffect(() => {
    const stepParam = searchParams.get("step");
    const campaignParam = searchParams.get("campaign_id");

    if (stepParam) {
      const stepIndex = steps.findIndex((s) => s.slug === stepParam);
      if (stepIndex !== -1) {
        setActiveStep(stepIndex + 1);
      }
    }

    if (campaignParam && !campaignId) {
      setCampaignId(campaignParam);
      loadCampaignData(campaignParam);
    }
  }, [searchParams]);

  // Load campaign data
  const loadCampaignData = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns?campaign_id=${id}`);
      const data = await response.json();

      if (data.success && data.campaign) {
        const campaign = data.campaign;
        setCampaignName(campaign.campaign_name);
        setCampaignType(campaign.campaign_type);
        setCampaignDescription(campaign.campaign_description || "");
        setProductUrl(campaign.product_url || "");
        setProductAboutUrl(campaign.product_about_url || "");
        setProductPricingUrl(campaign.product_pricing_url || "");
        setEmailSubject(campaign.email_subject || "");
        setEmailBody(campaign.email_body || "");

        toast.info("Campaign Loaded", {
          description: `Continuing "${campaign.campaign_name}"`,
        });
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
      toast.error("Error Loading Campaign", {
        description: "Failed to load campaign data",
      });
    }
  };

  // Update query param when step changes
  useEffect(() => {
    const currentSlug = steps[activeStep - 1]?.slug;
    if (currentSlug) {
      const url = campaignId
        ? `/onboard?step=${currentSlug}&campaign_id=${campaignId}`
        : `/onboard?step=${currentSlug}`;
      router.replace(url, { scroll: false });
    }
  }, [activeStep, router, campaignId]);

  // Save or update campaign
  const saveCampaign = async (): Promise<boolean> => {
    setIsSavingCampaign(true);
    try {
      const campaignData = {
        user_id: user.id,
        campaign_name: campaignName,
        campaign_type: campaignType,
        campaign_description: campaignDescription,
        product_url: productUrl,
        product_about_url: productAboutUrl,
        product_pricing_url: productPricingUrl,
        email_subject: emailSubject,
        email_body: emailBody,
        status: "draft",
      };

      if (campaignId) {
        // Update existing campaign
        const response = await fetch("/api/campaigns", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign_id: campaignId, ...campaignData }),
        });

        const data = await response.json();
        if (data.success) {
          toast.success("Campaign Updated", {
            description: `"${campaignName}" has been updated successfully`,
          });
          return true;
        } else {
          console.error("Failed to update campaign:", data.error);
          toast.error("Failed to Update Campaign", {
            description: data.error || "Please try again",
          });
          return false;
        }
      } else {
        // Create new campaign
        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignData),
        });

        const data = await response.json();
        if (data.success && data.campaign) {
          setCampaignId(data.campaign.id);
          console.log("Campaign created with ID:", data.campaign.id);
          toast.success("Campaign Created", {
            description: `"${campaignName}" has been saved successfully`,
          });
          return true;
        } else {
          console.error("Failed to create campaign:", data.error);
          toast.error("Failed to Create Campaign", {
            description: data.error || "Please try again",
          });
          return false;
        }
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.error("Error", {
        description: "Failed to save campaign. Please try again.",
      });
      return false;
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handleNext = async () => {
    // Step 1: Save campaign before moving to step 2
    if (activeStep === 1) {
      if (!campaignName) {
        toast.error("Campaign Name Required", {
          description: "Please enter a campaign name",
        });
        return;
      }
      const success = await saveCampaign();
      if (!success) {
        console.error("Failed to save campaign");
        return;
      }
      // Wait a bit to ensure campaignId is set
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Step 2: Save leads before moving to step 3
    if (activeStep === 2) {
      if (!campaignId) {
        toast.error("No Campaign Found", {
          description: "Please go back to step 1 and create a campaign",
        });
        return;
      }

      if (leadSource === "Manual Entry") {
        const hasLeads = manualLeads.some((lead) => lead.name);
        if (!hasLeads) {
          toast.warning("No Leads Entered", {
            description: "Please add at least one lead before continuing",
          });
          return;
        }
        await saveManualLeads();
      } else if (leadSource === "Upload CSV") {
        if (csvLeads.length === 0) {
          toast.warning("No CSV Uploaded", {
            description: "Please upload a CSV file with leads",
          });
          return;
        }
        await saveCsvLeads();
      }
      // Give a moment for saves to complete
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Step 4: Update campaign with email details
    if (activeStep === 4) {
      await saveCampaign();
    }

    // Move to next step
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
        lead.id === id ? { ...lead, [field]: value } : lead,
      ),
    );
  };

  // Prefill form with sample ElevenLabs data
  const prefillSampleData = () => {
    setCampaignName("Elevenlabs Subscriptions");
    setCampaignType("Lead Generation");
    setCampaignDescription(
      "Turn your words into lifelike voice in seconds. With an ElevenLabs subscription, you can generate natural-sounding AI voices, clone your own voice, and create professional narration for videos, podcasts, apps, and more. Whether you're building content or launching a product, ElevenLabs helps you sound world-class.",
    );
    setProductUrl("https://elevenlabs.io/");
    setProductAboutUrl("https://elevenlabs.io/about");
    setProductPricingUrl("https://elevenlabs.io/pricing");

    toast.success("Sample Data Loaded", {
      description: "ElevenLabs campaign data has been prefilled",
    });
  };

  const toggleLeadSelection = async (id: string) => {
    const isSelected = !selectedLeads.includes(id);
    const leadToUpdate = analyzedLeads.find((l) => l.id === id);

    setSelectedLeads((prev) =>
      isSelected ? [...prev, id] : prev.filter((leadId) => leadId !== id),
    );

    // Update lead selection in database if campaign exists
    if (campaignId && leadToUpdate) {
      try {
        const response = await fetch("/api/leads", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead_id: leadToUpdate.id,
            is_selected: isSelected,
          }),
        });

        const data = await response.json();
        if (data.success) {
          toast.success(isSelected ? "Lead Selected" : "Lead Deselected", {
            description: `${leadToUpdate.name} ${isSelected ? "added to" : "removed from"} your campaign`,
          });
        }
      } catch (error) {
        console.error("Error updating lead selection:", error);
        toast.error("Error", {
          description: "Failed to update lead selection",
        });
      }
    }
  };

  // Save manual leads to database
  const saveManualLeads = async () => {
    if (!campaignId) {
      console.error("Cannot save leads: campaignId is missing");
      toast.error("Campaign Not Found", {
        description: "Please create a campaign first before adding leads",
      });
      return;
    }

    if (manualLeads.length === 0) {
      console.log("No manual leads to save");
      return;
    }

    try {
      const leadsData = manualLeads
        .filter((lead) => lead.name) // Only save leads with a name
        .map((lead) => ({
          campaign_id: campaignId,
          name: lead.name,
          about: lead.about || null,
          linkedin: lead.linkedin || null,
          twitter: lead.twitter || null,
          source: "manual",
        }));

      console.log("Saving manual leads:", {
        count: leadsData.length,
        campaignId,
        leadsData,
      });

      if (leadsData.length === 0) {
        toast.warning("No Valid Leads", {
          description: "Please enter at least one lead name",
        });
        return;
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsData }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (data.success) {
        console.log(`Saved ${data.count} leads`);
        toast.success("Leads Saved", {
          description: `Successfully saved ${data.count} lead${data.count !== 1 ? "s" : ""} to your campaign`,
        });
      } else {
        console.error("API returned error:", data);
        toast.error("Failed to Save Leads", {
          description: data.details || data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error saving manual leads:", error);
      toast.error("Error", {
        description: "Failed to save leads. Check console for details.",
      });
    }
  };

  // Handle CSV file selection
  const handleCsvFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Invalid File Type", {
          description: "Please upload a CSV file",
        });
        return;
      }
      setCsvFile(file);
      parseCsvFile(file);
    }
  };

  // Parse CSV file
  const parseCsvFile = (file: File) => {
    setIsUploadingCsv(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const leads = results.data.map((row: any, index: number) => ({
          id: index + 1,
          name: row.Name || row.name || "",
          about: row.About || row.about || "",
          email: row.Email || row.email || "",
          linkedin: row.LinkedIn || row.linkedin || "",
          phone: row["Phone Number"] || row.phone || row.Phone || "",
        }));

        setCsvLeads(leads);
        setIsUploadingCsv(false);

        toast.success("CSV Parsed", {
          description: `Found ${leads.length} leads in the file`,
        });
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        setIsUploadingCsv(false);
        toast.error("Failed to Parse CSV", {
          description: "Please check your CSV format",
        });
      },
    });
  };

  // Save CSV leads to database
  const saveCsvLeads = async () => {
    if (!campaignId) {
      console.error("Cannot save leads: campaignId is missing");
      toast.error("Campaign Not Found", {
        description: "Please create a campaign first before adding leads",
      });
      return;
    }

    if (csvLeads.length === 0) {
      console.log("No CSV leads to save");
      return;
    }

    try {
      const leadsData = csvLeads
        .filter((lead) => lead.name) // Only save leads with a name
        .map((lead) => ({
          campaign_id: campaignId,
          name: lead.name,
          about: lead.about || null,
          email: lead.email || null,
          phone: lead.phone || null,
          linkedin: lead.linkedin || null,
          source: "csv",
        }));

      console.log("Saving CSV leads:", {
        count: leadsData.length,
        campaignId,
        leadsData,
      });

      if (leadsData.length === 0) {
        toast.warning("No Valid Leads", {
          description: "Please ensure your CSV has lead names",
        });
        return;
      }

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsData }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (data.success) {
        console.log(`Saved ${data.count} CSV leads`);
        toast.success("CSV Leads Saved", {
          description: `Successfully imported ${data.count} lead${data.count !== 1 ? "s" : ""} from CSV`,
        });
      } else {
        console.error("API returned error:", data);
        toast.error("Failed to Save CSV Leads", {
          description: data.details || data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error saving CSV leads:", error);
      toast.error("Error", {
        description: "Failed to save CSV leads. Check console for details.",
      });
    }
  };

  // Analyze leads with AI when entering Step 3
  const analyzeLeadsWithAI = async () => {
    if (!campaignId) return;

    setIsAnalyzingLeads(true);

    try {
      const response = await fetch("/api/analyze-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId }),
      });

      const data = await response.json();

      if (data.success && data.analyzed_leads) {
        // Transform the data to match the expected format
        const formattedLeads = data.analyzed_leads.map((lead: any) => ({
          id: lead.id,
          name: lead.name,
          about: lead.about || "",
          email: lead.email || "",
          linkedin: lead.linkedin || "",
          phone: lead.phone || "",
          fScore: lead.f_score || 50,
          reason: lead.reason || "Analysis in progress",
        }));

        setAnalyzedLeads(formattedLeads);

        toast.success("Leads Analyzed", {
          description: `AI analyzed ${data.count} leads with fit scores`,
        });
      } else {
        toast.warning("No Leads Found", {
          description: "Please add leads in Step 2 first",
        });
      }
    } catch (error) {
      console.error("Error analyzing leads:", error);
      toast.error("Analysis Failed", {
        description: "Failed to analyze leads. Using basic scoring.",
      });
    } finally {
      setIsAnalyzingLeads(false);
    }
  };

  // Trigger lead analysis when entering Step 3
  useEffect(() => {
    if (activeStep === 3 && campaignId && analyzedLeads.length === 0) {
      analyzeLeadsWithAI();
    }
  }, [activeStep, campaignId]);

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
  }, [
    activeStep,
    campaignName,
    productUrl,
    productAboutUrl,
    productPricingUrl,
  ]);

  // Generate email body based on campaign data
  const generateEmailBody = () => {
    let body = `Hi,\n\n`;
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
    body += `${user.firstName || "Your"} ${user.lastName || "Name"}`;

    return body;
  };

  // Get subtitle text based on active step
  const getStepSubtitle = () => {
    const subtitles = {
      1: "Let's get you set up with your first campaign",
      2: "Now let's source and add your leads",
      3: "Select the best leads for your campaign",
      4: "Configure your email outreach strategy",
      5: "Set up your call strategy and launch",
    };
    return subtitles[activeStep as keyof typeof subtitles] || subtitles[1];
  };

  // Handle starting a call
  const handleStartCall = async (leadId: string) => {
    const currentLead = analyzedLeads.find((l) => l.id === leadId);
    setActiveCallLead(leadId);
    setCallModalOpen(true);

    // Create call log entry
    if (campaignId && currentLead) {
      try {
        const response = await fetch("/api/call-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: campaignId,
            lead_id: leadId.toString(),
            call_status: "in_progress",
            started_at: new Date().toISOString(),
          }),
        });

        const data = await response.json();
        if (data.success) {
          toast.success("Call Started", {
            description: `Connected with ${currentLead.name}`,
          });
        }
      } catch (error) {
        console.error("Error creating call log:", error);
        toast.error("Error", {
          description: "Failed to start call log",
        });
      }
    }
  };

  // Handle ending a call
  const handleEndCall = async () => {
    // Update call log with end time and status
    if (campaignId && activeCallLead) {
      try {
        const currentLead = analyzedLeads.find((l) => l.id === activeCallLead);
        if (currentLead) {
          // You would get the actual call_log_id from the previous POST response
          // For now, we'll just log the end event
          console.log("Call ended for lead:", activeCallLead);
          toast.info("Call Ended", {
            description: `Call with ${currentLead.name} has been recorded`,
          });
        }
      } catch (error) {
        console.error("Error ending call:", error);
        toast.error("Error", {
          description: "Failed to end call properly",
        });
      }
    }

    setActiveCallLead(null);
    setCallModalOpen(false);
  };

  // Handle deal closed
  const handleDealClosed = () => {
    const currentLead = analyzedLeads.find((l) => l.id === activeCallLead);

    toast.success("Deal Closed!", {
      description: currentLead
        ? `Successfully closed deal with ${currentLead.name}`
        : "Deal marked as closed",
    });

    // Navigate to dashboard
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  // Get selected lead details
  const getSelectedLeadsWithDetails = () => {
    return analyzedLeads.filter((lead) => selectedLeads.includes(lead.id));
  };

  // Send email notification
  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      // Get selected leads' email addresses
      const selectedLeadsWithDetails = getSelectedLeadsWithDetails();
      const recipientEmails = selectedLeadsWithDetails
        .map((lead) => lead.email)
        .filter((email) => email); // Filter out empty emails

      if (recipientEmails.length === 0) {
        alert("❌ No email addresses found for selected leads. Please ensure leads have valid email addresses.");
        setIsSendingEmail(false);
        return;
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignName,
          campaignDescription,
          productUrl,
          productAboutUrl,
          productPricingUrl,
          emailSubject,
          emailBody,
          recipients: recipientEmails, // Pass selected leads' emails
        }),
      });

      const data = await response.json();
      console.log("Email API response:", data);

      if (response.ok && data.success) {
        setEmailSent(true);
        alert(`✅ Email sent successfully to ${data.recipients.join(", ")}`);
      } else {
        // Show detailed error messages
        let errorMsg = "❌ Failed to send email:\n\n";

        if (data.errors && Array.isArray(data.errors)) {
          errorMsg += data.errors.join("\n");
        } else if (data.error) {
          errorMsg += data.error;
          if (data.details) {
            errorMsg += "\n\nDetails: " + data.details;
          }
        } else if (data.message) {
          errorMsg += data.message;
        } else {
          errorMsg += "Unknown error occurred";
        }

        if (data.successes && data.successes > 0) {
          errorMsg += `\n\n✅ ${data.successes} email(s) sent successfully`;
        }

        alert(errorMsg);
        console.error("Email send failed:", data);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("❌ Failed to send email. Please check the console for details.");
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
          <p className="text-gray-400">{getStepSubtitle()}</p>
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
                    <StepperIndicator className="bg-zinc-800 rounded-full h-1 w-full data-[state=active]:bg-orange-500 data-[state=completed]:bg-orange-500"></StepperIndicator>
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 group-data-[state=active]/step:bg-orange-500 group-data-[state=completed]/step:bg-orange-500 transition-colors">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Alice Block - Left Side */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                      <video
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src="/alice-video.mp4" type="video/mp4" />
                      </video>

                      {/* Gradient Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="bg-zinc-900/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                          <span className="text-white text-xs font-medium">
                            Alice - AI Phone Agent
                          </span>
                        </div>
                        <div className="bg-green-500/90 backdrop-blur-md rounded-full px-2.5 py-1 border border-green-400/20">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-medium text-white">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Card */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 p-3">
                          <p className="text-white text-xs font-medium mb-1">
                            Ready to help you set up your campaign
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            I'll guide you through the process
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Content - Right Side */}
                <div className="lg:col-span-8">
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-white">
                        Create Your Campaign
                      </h2>
                      <button
                        onClick={prefillSampleData}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                        title="Prefill with sample ElevenLabs data"
                      >
                        Pre-Fill
                      </button>
                    </div>
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
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option>Lead Generation</option>
                            <option>Customer Engagement</option>
                            <option>Product Launch</option>
                            <option>Follow-up Campaign</option>
                            <option>Revenue Growth</option>
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
                          onChange={(e) =>
                            setCampaignDescription(e.target.value)
                          }
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="https://example.com/pricing"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 2: Source Leads */}
            <StepperContent value={2}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Alice Block - Left Side */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                      <video
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src="/alice-video.mp4" type="video/mp4" />
                      </video>

                      {/* Gradient Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="bg-zinc-900/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                          <span className="text-white text-xs font-medium">
                            Alice - AI Phone Agent
                          </span>
                        </div>
                        <div className="bg-green-500/90 backdrop-blur-md rounded-full px-2.5 py-1 border border-green-400/20">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-medium text-white">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Card */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 p-3">
                          <p className="text-white text-xs font-medium mb-1">
                            Upload your leads or enter them manually
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            I'll help you organize your contact list
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Content - Right Side */}
                <div className="lg:col-span-8">
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
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
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option>Upload CSV</option>
                          <option>Manual Entry</option>
                        </select>
                      </div>

                      {leadSource === "Upload CSV" ? (
                        <div className="space-y-4">
                          {/* File Upload Area */}
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-gray-600 transition-colors cursor-pointer"
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv"
                              onChange={handleCsvFileSelect}
                              className="hidden"
                            />
                            <div className="text-gray-400">
                              {isUploadingCsv ? (
                                <>
                                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                  <p className="text-sm">Parsing CSV...</p>
                                </>
                              ) : csvFile ? (
                                <>
                                  <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-white">
                                    {csvFile.name}
                                  </p>
                                  <p className="text-xs mt-1">
                                    {csvLeads.length} leads found
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCsvFile(null);
                                      setCsvLeads([]);
                                    }}
                                    className="mt-2 text-xs text-orange-400 hover:text-orange-300"
                                  >
                                    Change file
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs mt-1">
                                    CSV (MAX. 10MB)
                                  </p>
                                </>
                              )}
                            </div>
                          </div>

                          {/* CSV Preview */}
                          {csvLeads.length > 0 && (
                            <div className="bg-zinc-800 rounded-lg p-4">
                              <h3 className="text-sm font-medium text-white mb-3">
                                Preview ({csvLeads.length} leads)
                              </h3>
                              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-zinc-800">
                                    <tr className="border-b border-zinc-700">
                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">
                                        Name
                                      </th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">
                                        About
                                      </th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">
                                        Email
                                      </th>
                                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">
                                        Phone
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {csvLeads.slice(0, 5).map((lead, index) => (
                                      <tr
                                        key={index}
                                        className="border-b border-zinc-700/50"
                                      >
                                        <td className="py-2 px-3 text-white">
                                          {lead.name}
                                        </td>
                                        <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]">
                                          {lead.about}
                                        </td>
                                        <td className="py-2 px-3 text-gray-400">
                                          {lead.email}
                                        </td>
                                        <td className="py-2 px-3 text-gray-400">
                                          {lead.phone}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {csvLeads.length > 5 && (
                                  <p className="text-xs text-gray-500 mt-2 text-center">
                                    + {csvLeads.length - 5} more leads
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-zinc-700">
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
                                    className="border-b border-zinc-800"
                                  >
                                    <td className="py-2 px-4">
                                      <input
                                        type="text"
                                        value={lead.name}
                                        onChange={(e) =>
                                          updateManualLead(
                                            lead.id,
                                            "name",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                                            e.target.value,
                                          )
                                        }
                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        placeholder="@username"
                                      />
                                    </td>
                                    <td className="py-2 px-4">
                                      <button
                                        onClick={() =>
                                          removeManualLead(lead.id)
                                        }
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
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
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
                            className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded"
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
                </div>
              </div>
            </StepperContent>

            {/* Step 3: Select Leads */}
            <StepperContent value={3}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Alice Block - Left Side */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                      <video
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src="/alice-video.mp4" type="video/mp4" />
                      </video>

                      {/* Gradient Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="bg-zinc-900/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                          <span className="text-white text-xs font-medium">
                            Alice - AI Phone Agent
                          </span>
                        </div>
                        <div className="bg-green-500/90 backdrop-blur-md rounded-full px-2.5 py-1 border border-green-400/20">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-medium text-white">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Card */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 p-3">
                          <p className="text-white text-xs font-medium mb-1">
                            Analyzing your leads with AI
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            I'll help you identify the best prospects
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Content - Right Side */}
                <div className="lg:col-span-8">
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                      Select Your Target Leads
                    </h2>

                    {isAnalyzingLeads ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Analyzing Leads with AI
                        </h3>
                        <p className="text-gray-400 text-sm text-center max-w-md">
                          Claude AI is analyzing each lead profile against your
                          campaign details to calculate fit scores...
                        </p>
                      </div>
                    ) : analyzedLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-gray-600 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No Leads Found
                        </h3>
                        <p className="text-gray-400 text-sm text-center max-w-md mb-4">
                          Please go back to Step 2 and add some leads first
                        </p>
                        <button
                          onClick={() => setActiveStep(2)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Go to Source Leads
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Total Leads Sourced
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {analyzedLeads.length}
                            </p>
                          </div>
                          <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Total Matched Leads
                            </p>
                            <p className="text-2xl font-bold text-white">
                              {
                                analyzedLeads.filter((lead) => lead.fScore > 49)
                                  .length
                              }
                            </p>
                          </div>
                          <div className="bg-zinc-800 rounded-lg p-4">
                            <p className="text-sm text-gray-400 mb-1">
                              Suggested Leads
                            </p>
                            <p className="text-2xl font-bold text-orange-500">
                              {
                                analyzedLeads.filter(
                                  (lead) => lead.fScore >= 90,
                                ).length
                              }
                            </p>
                          </div>
                        </div>

                        {/* Leads Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-zinc-700">
                                <th className="text-left py-3 px-4 w-12">
                                  <input
                                    type="checkbox"
                                    checked={
                                      selectedLeads.length ===
                                      analyzedLeads.length
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedLeads(
                                          analyzedLeads.map((l) => l.id),
                                        );
                                      } else {
                                        setSelectedLeads([]);
                                      }
                                    }}
                                    className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded cursor-pointer"
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
                              {analyzedLeads.map((lead) => (
                                <tr
                                  key={lead.id}
                                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                                >
                                  <td className="py-3 px-4">
                                    <input
                                      type="checkbox"
                                      checked={selectedLeads.includes(lead.id)}
                                      onChange={() =>
                                        toggleLeadSelection(lead.id)
                                      }
                                      className="w-4 h-4 bg-zinc-800 border-zinc-700 rounded cursor-pointer"
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
                                  <td className="py-3 px-4 text-sm text-orange-400">
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
                                            ? "bg-orange-900/30 text-orange-400"
                                            : "bg-yellow-900/30 text-yellow-400"
                                      }`}
                                    >
                                      {lead.fScore}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="group relative">
                                      <Info className="h-4 w-4 text-gray-400 cursor-help" />
                                      <div className="absolute right-0 top-6 w-64 p-3 bg-zinc-950 border border-zinc-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
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
                          <div className="bg-orange-900/20 border border-orange-800 rounded-lg p-3">
                            <p className="text-sm text-orange-300">
                              {selectedLeads.length} lead
                              {selectedLeads.length !== 1 ? "s" : ""} selected
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </StepperContent>

            {/* Step 4: Outreach - Email */}
            <StepperContent value={4}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Julian Block - Left Side */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                      <video
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src="/julian-video.mp4" type="video/mp4" />
                      </video>

                      {/* Gradient Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="bg-zinc-900/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                          <span className="text-white text-xs font-medium">
                            Julian - AI Leads Agent
                          </span>
                        </div>
                        <div className="bg-green-500/90 backdrop-blur-md rounded-full px-2.5 py-1 border border-green-400/20">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-medium text-white">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Card */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 p-3">
                          <p className="text-white text-xs font-medium mb-1">
                            Crafting personalized email outreach
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            I'll help you engage prospects effectively
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Content - Right Side */}
                <div className="lg:col-span-8">
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
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
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Write your email message..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use variables: {"{"}name{"}"}, {"{"}company{"}"},{" "}
                          {"{"}
                          title{"}"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Send Time
                          </label>
                          <select className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option>Immediately</option>
                            <option>Schedule for later</option>
                            <option>Best time per recipient</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Follow-up
                          </label>
                          <select className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                            <option>No follow-up</option>
                            <option>After 3 days</option>
                            <option>After 7 days</option>
                            <option>Custom schedule</option>
                          </select>
                        </div>
                      </div>

                      {/* Send Email Notification Button */}
                      <div className="mt-6 pt-6 border-t border-zinc-700">
                        <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                          <h3 className="text-sm font-medium text-white mb-2">
                            📧 Campaign Notification
                          </h3>
                          <p className="text-xs text-gray-400 mb-3">
                            Send campaign details with product information to
                            your team via email
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail className="h-3.5 w-3.5" />
                            <span>
                              Recipients: shreyansh.saurabh0107@gmail.com,
                              binaryshrey@gmail.com
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleSendEmail}
                          disabled={
                            isSendingEmail || emailSent || !campaignName
                          }
                          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            emailSent
                              ? "bg-green-600 text-white cursor-not-allowed"
                              : isSendingEmail
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : campaignName
                                  ? "bg-orange-600 text-white hover:bg-orange-700"
                                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
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
                </div>
              </div>
            </StepperContent>

            {/* Step 5: Call Center */}
            <StepperContent value={5}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Julian Block - Left Side */}
                <div className="lg:col-span-4">
                  <div className="sticky top-6 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
                      <video
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      >
                        <source src="/julian-video.mp4" type="video/mp4" />
                      </video>

                      {/* Gradient Overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Status Badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <div className="bg-zinc-900/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                          <span className="text-white text-xs font-medium">
                            Julian - AI Leads Agent
                          </span>
                        </div>
                        <div className="bg-green-500/90 backdrop-blur-md rounded-full px-2.5 py-1 border border-green-400/20">
                          <div className="flex items-center gap-1">
                            <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-medium text-white">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Card */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl border border-white/10 p-3">
                          <p className="text-white text-xs font-medium mb-1">
                            Ready to start making calls
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            I'll help you close more deals
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Content - Right Side */}
                <div className="lg:col-span-8">
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-white mb-1">
                          Call Center
                        </h2>
                        <p className="text-sm text-gray-400">
                          {getSelectedLeadsWithDetails().length} lead
                          {getSelectedLeadsWithDetails().length !== 1
                            ? "s"
                            : ""}{" "}
                          ready to call
                        </p>
                      </div>
                      <div className="bg-zinc-800 rounded-lg px-4 py-2">
                        <p className="text-xs text-gray-400">Campaign</p>
                        <p className="text-sm font-semibold text-white">
                          {campaignName || "Untitled Campaign"}
                        </p>
                      </div>
                    </div>

                    {getSelectedLeadsWithDetails().length === 0 ? (
                      <div className="bg-zinc-800/50 rounded-lg p-12 text-center">
                        <Phone className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No Leads Selected
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Please go back to Step 3 and select leads to call
                        </p>
                        <button
                          onClick={() => setActiveStep(3)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Go to Select Leads
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getSelectedLeadsWithDetails().map((lead) => (
                          <div
                            key={lead.id}
                            className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                                {lead.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-white font-semibold">
                                    {lead.name}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      lead.fScore >= 90
                                        ? "bg-green-900/30 text-green-400"
                                        : lead.fScore >= 85
                                          ? "bg-orange-900/30 text-orange-400"
                                          : "bg-yellow-900/30 text-yellow-400"
                                    }`}
                                  >
                                    F-Score: {lead.fScore}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400">
                                  {lead.about}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {lead.email}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleStartCall(lead.id)}
                              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              <Phone className="h-4 w-4" />
                              Call Now
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Modal */}
              {callModalOpen && activeCallLead && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                    {(() => {
                      const currentLead = analyzedLeads.find(
                        (l) => l.id === activeCallLead,
                      );
                      if (!currentLead) return null;

                      return (
                        <>
                          {/* Modal Header */}
                          <div className="bg-zinc-800 p-6 border-b border-zinc-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-2xl">
                                  {currentLead.name.charAt(0)}
                                </div>
                                <div>
                                  <h2 className="text-2xl font-bold text-white mb-1">
                                    {currentLead.name}
                                  </h2>
                                  <p className="text-gray-400 text-sm">
                                    {currentLead.about}
                                  </p>
                                  <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {currentLead.phone}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={handleEndCall}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                              >
                                End Call
                              </button>
                            </div>
                          </div>

                          {/* Modal Content */}
                          <div className="p-6">
                            <div className="grid grid-cols-3 gap-6 mb-6">
                              {/* Live Waveform */}
                              <div className="col-span-2 bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                                <h3 className="text-sm font-medium text-gray-300 mb-4">
                                  Live Audio Activity
                                </h3>
                                <div className="h-32 flex items-center justify-center gap-1">
                                  {[...Array(50)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="w-1 bg-orange-500 rounded-full animate-pulse"
                                      style={{
                                        height: `${Math.random() * 100 + 20}%`,
                                        animationDelay: `${i * 0.05}s`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                                  <span>00:00</span>
                                  <span className="text-orange-400 font-medium">
                                    ● Recording
                                  </span>
                                  <span>02:34</span>
                                </div>
                              </div>

                              {/* Confidence Score Pie Chart */}
                              <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                                <h3 className="text-sm font-medium text-gray-300 mb-4">
                                  Confidence Score
                                </h3>
                                <div className="relative w-40 h-40 mx-auto">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                      cx="80"
                                      cy="80"
                                      r="70"
                                      fill="none"
                                      stroke="#27272a"
                                      strokeWidth="12"
                                    />
                                    <circle
                                      cx="80"
                                      cy="80"
                                      r="70"
                                      fill="none"
                                      stroke="#f97316"
                                      strokeWidth="12"
                                      strokeDasharray={`${(currentLead.fScore / 100) * 440} 440`}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-4xl font-bold text-white">
                                      {currentLead.fScore}%
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      Confidence
                                    </span>
                                  </div>
                                </div>
                                {currentLead.fScore >= 80 && (
                                  <button
                                    onClick={handleDealClosed}
                                    className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                  >
                                    ✓ Mark Deal Closed
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Live Transcript */}
                            <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
                              <h3 className="text-sm font-medium text-gray-300 mb-4">
                                Live Transcript
                              </h3>
                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="text-xs text-gray-500">
                                    AI Agent
                                  </span>
                                  <div className="px-4 py-2 rounded-lg max-w-[80%] bg-orange-900/30 text-orange-100">
                                    <p className="text-sm">
                                      Hello! I'm calling from{" "}
                                      {campaignName || "our company"}. How are
                                      you today?
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    Just now
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                  <span className="text-xs text-gray-500">
                                    Prospect
                                  </span>
                                  <div className="px-4 py-2 rounded-lg max-w-[80%] bg-zinc-700 text-gray-100">
                                    <p className="text-sm">
                                      Hi, I'm doing well. What can I do for you?
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    Just now
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="text-xs text-gray-500">
                                    AI Agent
                                  </span>
                                  <div className="px-4 py-2 rounded-lg max-w-[80%] bg-orange-900/30 text-orange-100">
                                    <p className="text-sm">
                                      I wanted to share information about our
                                      solution that can help increase your
                                      conversion rates. Would you be interested
                                      in learning more?
                                    </p>
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    Just now
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </StepperContent>
          </StepperPanel>
        </Stepper>

        {/* Navigation Buttons */}
        <div
          className={`flex ${activeStep === 1 ? "justify-end" : "justify-between"} mt-8 gap-4`}
        >
          {activeStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={activeStep === steps.length || isSavingCampaign}
            className={`flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              activeStep === 1 ? "w-full" : "flex-1"
            }`}
          >
            {isSavingCampaign ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {activeStep === steps.length ? "Finish" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
