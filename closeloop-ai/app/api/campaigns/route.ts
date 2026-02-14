import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { CampaignInsert, CampaignUpdate } from '@/types/database';

// POST: Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const campaignData: CampaignInsert = {
      user_id: body.user_id,
      campaign_name: body.campaign_name,
      campaign_type: body.campaign_type,
      campaign_description: body.campaign_description || null,
      product_url: body.product_url || null,
      product_about_url: body.product_about_url || null,
      product_pricing_url: body.product_pricing_url || null,
      email_subject: body.email_subject || null,
      email_body: body.email_body || null,
      status: body.status || 'draft',
    };

    const { data, error } = await supabase
      .from('campaigns')
      // @ts-ignore - Supabase type inference issue
      .insert(campaignData)
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: data,
    });
  } catch (error) {
    console.error('Error in POST /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch campaigns by user_id or campaign_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const campaignId = searchParams.get('campaign_id');
    const supabase = createServerSupabaseClient();

    if (campaignId) {
      // Fetch specific campaign
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
          { error: 'Failed to fetch campaign', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, campaign: data });
    } else if (userId) {
      // Fetch all campaigns for user
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
          { error: 'Failed to fetch campaigns', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, campaigns: data });
    } else {
      return NextResponse.json(
        { error: 'Missing user_id or campaign_id parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing campaign
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_id, ...updateData } = body;

    if (!campaign_id) {
      return NextResponse.json(
        { error: 'Missing campaign_id' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const campaignUpdate: CampaignUpdate = {
      campaign_name: updateData.campaign_name,
      campaign_type: updateData.campaign_type,
      campaign_description: updateData.campaign_description,
      product_url: updateData.product_url,
      product_about_url: updateData.product_about_url,
      product_pricing_url: updateData.product_pricing_url,
      email_subject: updateData.email_subject,
      email_body: updateData.email_body,
      status: updateData.status,
    };

    const { data, error } = await supabase
      .from('campaigns')
      // @ts-ignore - Supabase type inference issue
      .update(campaignUpdate)
      .eq('id', campaign_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to update campaign', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: data,
    });
  } catch (error) {
    console.error('Error in PATCH /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
