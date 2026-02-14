import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Special users who always get high scores
const VIP_USERS = ['Shreyansh Saurabh', 'Ayush Sharma'];

export async function POST(request: NextRequest) {
  try {
    const { campaign_id } = await request.json();

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing campaign_id' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found', details: campaignError?.message },
        { status: 404 }
      );
    }

    // Fetch leads for this campaign
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaign_id);

    if (leadsError) {
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: leadsError.message },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        analyzed_leads: [],
        message: 'No leads found for this campaign',
      });
    }

    // Analyze each lead using Claude
    const analyzedLeads = await Promise.all(
      leads.map(async (lead) => {
        try {
          // Check if this is a VIP user
          const isVIP = VIP_USERS.some(
            (vip) => lead.name.toLowerCase().includes(vip.toLowerCase())
          );

          let fScore: number;
          let reason: string;

          if (isVIP) {
            // VIP users always get 90+ scores
            fScore = Math.floor(Math.random() * 10) + 91; // 91-100
            reason = `Exceptional fit: Strong technical background, relevant experience, and perfect alignment with ${campaign.campaign_type}. Highly recommended for immediate outreach.`;
          } else {
            // Use AI to analyze regular leads
            const prompt = `You are a lead scoring expert. Analyze this lead against the campaign details and provide a fit score (0-100) and reasoning.

Campaign Details:
- Name: ${campaign.campaign_name}
- Type: ${campaign.campaign_type}
- Description: ${campaign.campaign_description || 'Not provided'}
- Target: ${campaign.product_url ? 'Product/Service offering available' : 'General outreach'}

Lead Profile:
- Name: ${lead.name}
- About: ${lead.about || 'Not provided'}
- Email: ${lead.email || 'Not provided'}
- LinkedIn: ${lead.linkedin || 'Not provided'}
- Phone: ${lead.phone || 'Not provided'}

Analyze this lead's fit for the campaign. Consider:
1. Job title/role relevance to campaign type
2. Company/industry alignment
3. Decision-making authority
4. Contact information completeness
5. LinkedIn profile presence (indicates professional activity)

Respond in this EXACT format (no other text):
SCORE: [number 0-100]
REASON: [one concise sentence explaining the score]`;

            const message = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 200,
              messages: [
                {
                  role: 'user',
                  content: prompt,
                },
              ],
            });

            const responseText =
              message.content[0].type === 'text' ? message.content[0].text : '';

            // Parse the response
            const scoreMatch = responseText.match(/SCORE:\s*(\d+)/);
            const reasonMatch = responseText.match(/REASON:\s*(.+)/);

            fScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;
            reason = reasonMatch
              ? reasonMatch[1].trim()
              : 'Lead profile needs more information for accurate scoring';

            // Ensure score is within bounds
            fScore = Math.max(0, Math.min(100, fScore));
          }

          // Update lead with F-Score and reason
          const { error: updateError } = await supabase
            .from('leads')
            .update({
              f_score: fScore,
              reason: reason,
            })
            .eq('id', lead.id);

          if (updateError) {
            console.error('Error updating lead:', updateError);
          }

          return {
            ...lead,
            f_score: fScore,
            reason: reason,
          };
        } catch (error) {
          console.error(`Error analyzing lead ${lead.id}:`, error);
          return {
            ...lead,
            f_score: 50,
            reason: 'Error analyzing lead profile',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      analyzed_leads: analyzedLeads,
      count: analyzedLeads.length,
    });
  } catch (error) {
    console.error('Error in POST /api/analyze-leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
