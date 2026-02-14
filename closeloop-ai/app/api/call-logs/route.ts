import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import type { CallLogInsert, CallLogUpdate } from '@/types/database';

// POST: Create a new call log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const callLogData: CallLogInsert = {
      campaign_id: body.campaign_id,
      lead_id: body.lead_id,
      call_status: body.call_status || 'initiated',
      call_duration: body.call_duration || null,
      confidence_score: body.confidence_score || null,
      transcript: body.transcript || null,
      recording_url: body.recording_url || null,
      started_at: body.started_at || new Date().toISOString(),
      ended_at: body.ended_at || null,
    };

    const { data, error } = await supabase
      .from('call_logs')
      .insert(callLogData)
      .select()
      .single();

    if (error) {
      console.error('Error creating call log:', error);
      return NextResponse.json(
        { error: 'Failed to create call log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      call_log: data,
    });
  } catch (error) {
    console.error('Error in POST /api/call-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Fetch call logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const leadId = searchParams.get('lead_id');
    const callLogId = searchParams.get('call_log_id');
    const supabase = createServerSupabaseClient();

    if (callLogId) {
      // Fetch specific call log
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('id', callLogId)
        .single();

      if (error) {
        console.error('Error fetching call log:', error);
        return NextResponse.json(
          { error: 'Failed to fetch call log', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, call_log: data });
    } else if (leadId) {
      // Fetch all call logs for a specific lead
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching call logs:', error);
        return NextResponse.json(
          { error: 'Failed to fetch call logs', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, call_logs: data, count: data.length });
    } else if (campaignId) {
      // Fetch all call logs for campaign
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching call logs:', error);
        return NextResponse.json(
          { error: 'Failed to fetch call logs', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, call_logs: data, count: data.length });
    } else {
      return NextResponse.json(
        { error: 'Missing campaign_id, lead_id, or call_log_id parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/call-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing call log
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { call_log_id, ...updateData } = body;

    if (!call_log_id) {
      return NextResponse.json(
        { error: 'Missing call_log_id' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const callLogUpdate: CallLogUpdate = {
      call_status: updateData.call_status,
      call_duration: updateData.call_duration,
      confidence_score: updateData.confidence_score,
      transcript: updateData.transcript,
      recording_url: updateData.recording_url,
      ended_at: updateData.ended_at,
    };

    const { data, error } = await supabase
      .from('call_logs')
      .update(callLogUpdate)
      .eq('id', call_log_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating call log:', error);
      return NextResponse.json(
        { error: 'Failed to update call log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      call_log: data,
    });
  } catch (error) {
    console.error('Error in PATCH /api/call-logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
