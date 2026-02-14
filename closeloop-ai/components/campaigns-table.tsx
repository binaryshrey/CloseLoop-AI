"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconCircleCheckFilled,
  IconLoader,
  IconDotsVertical,
  IconPlus,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Campaign } from "@/types/database"

interface CampaignsTableProps {
  userId: string
}

export function CampaignsTable({ userId }: CampaignsTableProps) {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true)
        const response = await fetch(`/api/campaigns?user_id=${userId}`)
        const data = await response.json()

        if (data.success) {
          setCampaigns(data.campaigns || [])
        } else {
          setError(data.error || "Failed to fetch campaigns")
        }
      } catch (err) {
        setError("Failed to load campaigns")
        console.error("Error fetching campaigns:", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchCampaigns()
    }
  }, [userId])

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      paused: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    }

    return (
      <Badge
        variant="outline"
        className={`${statusColors[status] || ""} px-2 py-1`}
      >
        {status === "active" && <IconCircleCheckFilled className="mr-1 size-3" />}
        {status === "draft" && <IconLoader className="mr-1 size-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader className="animate-spin size-8 text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground text-sm">
            Manage your marketing campaigns
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 size-4" />
          New Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground mb-4">No campaigns found</p>
          <Button>
            <IconPlus className="mr-2 size-4" />
            Create Your First Campaign
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.campaign_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-muted-foreground">
                      {campaign.campaign_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {campaign.campaign_description || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(campaign.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(campaign.updated_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="data-[state=open]:bg-muted text-muted-foreground size-8"
                          size="icon"
                        >
                          <IconDotsVertical className="size-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
