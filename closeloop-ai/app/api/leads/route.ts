import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { LeadInsert, LeadUpdate } from '@/types/database';

// POST: Create new leads (bulk or single)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    // Support both single lead and bulk lead insertion
    const leads = Array.isArray(body.leads) ? body.leads : [body];

    const leadsData: LeadInsert[] = leads.map((lead: any) => ({
      campaign_id: lead.campaign_id,
      name: lead.name,
      about: lead.about || null,
      email: lead.email || null,
      phone: lead.phone || null,
      linkedin: lead.linkedin || null,
      twitter: lead.twitter || null,
      f_score: lead.f_score || null,
      reason: lead.reason || null,
      is_selected: lead.is_selected || false,
      source: lead.source || 'manual',
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsData)
      .select();

    if (error) {
      console.error('Error creating leads:', error);
      return NextResponse.json(
        { error: 'Failed to create leads', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch leads by campaign_id or lead_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const leadId = searchParams.get('lead_id');
    const selectedOnly = searchParams.get('selected_only') === 'true';
    const supabase = createServerSupabaseClient();

    if (leadId) {
      // Fetch specific lead
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        console.error('Error fetching lead:', error);
        return NextResponse.json(
          { error: 'Failed to fetch lead', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, lead: data });
    } else if (campaignId) {
      // Fetch all leads for campaign
      let query = supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaignId);

      if (selectedOnly) {
        query = query.eq('is_selected', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json(
          { error: 'Failed to fetch leads', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, leads: data, count: data.length });
    } else {
      return NextResponse.json(
        { error: 'Missing campaign_id or lead_id parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing lead
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, ...updateData } = body;

    if (!lead_id) {
      return NextResponse.json(
        { error: 'Missing lead_id' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const leadUpdate: LeadUpdate = {
      name: updateData.name,
      about: updateData.about,
      email: updateData.email,
      phone: updateData.phone,
      linkedin: updateData.linkedin,
      twitter: updateData.twitter,
      f_score: updateData.f_score,
      reason: updateData.reason,
      is_selected: updateData.is_selected,
      source: updateData.source,
    };

    const { data, error } = await supabase
      .from('leads')
      .update(leadUpdate)
      .eq('id', lead_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json(
        { error: 'Failed to update lead', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: data,
    });
  } catch (error) {
    console.error('Error in PATCH /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Bulk update leads (e.g., updating is_selected for multiple leads)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_ids, update_data } = body;

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid lead_ids array' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('leads')
      .update(update_data)
      .in('id', lead_ids)
      .select();

    if (error) {
      console.error('Error bulk updating leads:', error);
      return NextResponse.json(
        { error: 'Failed to update leads', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error in PUT /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
