/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import { clsx } from 'clsx';

import { type ReactNode, useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { DownloadIcon, InfoIcon, DatabaseIcon, PlayIcon, SaveIcon, RefreshCwIcon } from 'lucide-react';
import { useChatRuntime } from '../../chat/chatruntimeprovider';

const ICON_MAP: Record<string, any> = {
  database: DatabaseIcon,
  save: SaveIcon,
  play: PlayIcon,
  refresh: RefreshCwIcon,
};

export function ScheduleRenderer({
  result,
}: ScheduleRenderer.Props): ReactNode {
  const runtime = useChatRuntime();

  // Defensive coding: Ensure data exists
  if (!result || !result.data) {
    return (
      <div className='text-destructive border-destructive rounded-md border p-4'>
        Error: No schedule data received.
      </div>
    );
  }

  const { status, view, axis, items = [], actions = [] } = result.data;

  // Safe access for axes
  const rows = axis?.rows || [];
  const cols = axis?.columns || [];

  if (rows.length === 0 || cols.length === 0) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Schedule Generation Incomplete</CardTitle>
          <CardDescription>
            {status === 'Infeasible'
              ? 'The optimization engine could not find a valid schedule with the current constraints.'
              : 'No schedule data available to render.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Transform items into a lookup map: [row_id][col_id] -> Item
  const itemMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    items.forEach((item: any) => {
      if (!map[item.row_id]) {
        map[item.row_id] = {};
      }
      map[item.row_id][item.col_id] = item;
    });
    return map;
  }, [items]);

  const handleExport = () => {
    // Generate CSV content
    const headers = [
      view?.row_label || 'Row',
      view?.col_label || 'Column',
      view?.item_label || 'Item',
      'Subtitle',
      'Details',
    ];
    
    // Create rows based on grid + items
    // Let's export the items list as it's cleaner for data analysis
    const csvRows = items.map((item: any) => {
       const rowObj = rows.find(r => r.id === item.row_id);
       const colObj = cols.find(c => c.id === item.col_id);
       
       // Flatten details into a string
       const detailsStr = (item.details || [])
         .map((d: any) => `${d.label}: ${d.value}`)
         .join('; ');

       return [
         rowObj?.label || item.row_id,
         colObj?.label || item.col_id,
         item.title,
         item.subtitle || '',
         detailsStr
       ];
    });

    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) => row.map((c) => `"${c}"`).join(',')), // Quote fields
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'schedule_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className='w-full overflow-hidden'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span>{view?.title || 'Schedule'}</span>
            <Badge variant={status === 'Success' ? 'default' : 'destructive'}>
              {status}
            </Badge>
          </div>
          <div className='flex items-center gap-2'>
            <Button size='sm' variant='outline' onClick={handleExport}>
              <DownloadIcon className='mr-2 h-4 w-4' />
              Export CSV
            </Button>
            {actions.map((action: any, i: number) => {
               const Icon = ICON_MAP[action.icon] || PlayIcon;
               return (
                  <Button
                    key={i}
                    size='sm'
                    onClick={() => runtime.onUserSubmit(action.prompt)}
                  >
                    <Icon className='mr-2 h-4 w-4' />
                    {action.label}
                  </Button>
               );
            })}
          </div>
        </CardTitle>
        <CardDescription>
          {items.length} {view?.item_label?.toLowerCase() || 'items'} scheduled across {rows.length} {view?.row_label?.toLowerCase() || 'rows'}.
        </CardDescription>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>{view?.row_label || 'Row'}</TableHead>
              {cols.map((c: any) => (
                <TableHead key={c.id} className='min-w-[140px]'>
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className='bg-muted/50 font-medium'>
                  {row.label}
                  {row.sub_label && (
                    <div className='text-muted-foreground text-xs'>
                      {row.sub_label}
                    </div>
                  )}
                </TableCell>
                {cols.map((col: any) => {
                  const item = itemMap[row.id]?.[col.id];
                  return (
                    <TableCell key={`${row.id}-${col.id}`} className='border-l p-2'>
                      {item ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div
                              className={clsx(
                                'bg-primary/10 border-primary/20 rounded-md border p-2 text-xs',
                                'hover:bg-primary/20 cursor-pointer transition-colors',
                              )}
                            >
                              <div
                                className='truncate font-bold'
                                title={item.title}
                              >
                                {item.title}
                              </div>
                              <div
                                className='text-muted-foreground truncate'
                                title={item.subtitle}
                              >
                                {item.subtitle}
                              </div>
                              <div className='mt-1 flex items-center justify-between text-[10px]'>
                                <span className='text-muted-foreground/80'>{item.footer}</span>
                                <InfoIcon className='h-3 w-3 opacity-50' />
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className='flex max-h-[80vh] flex-col'>
                            <DialogHeader>
                              <DialogTitle>{item.title}</DialogTitle>
                              <DialogDescription>
                                {item.subtitle} • {row.label} • {col.label}
                              </DialogDescription>
                            </DialogHeader>

                            <div className='bg-muted/20 mt-2 min-h-0 flex-1 overflow-y-auto rounded-md border p-2'>
                              <div className="space-y-4">
                                {item.details?.map((detail: any, i: number) => (
                                  <div key={i}>
                                     <h4 className='mb-1 text-sm font-semibold'>{detail.label}</h4>
                                     {detail.type === 'list' && Array.isArray(detail.value) ? (
                                        <ul className='space-y-1 text-sm'>
                                          {detail.value.length > 0 ? (
                                            detail.value.map((v: string, idx: number) => (
                                              <li key={idx} className='flex items-center gap-2'>
                                                <span className='bg-primary/50 h-1.5 w-1.5 rounded-full' />
                                                {v}
                                              </li>
                                            ))
                                          ) : (
                                            <li className='text-muted-foreground italic'>Empty</li>
                                          )}
                                        </ul>
                                     ) : (
                                        <p className="text-sm">{detail.value}</p>
                                     )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className='bg-secondary/20 mt-4 rounded-md border p-3 text-sm'>
                              <h4 className='mb-1 font-semibold'>
                                Want to move this?
                              </h4>
                              <p className='text-muted-foreground text-xs'>
                                Ask the agent:
                                <span className='bg-muted ml-1 rounded px-1 font-mono select-all'>
                                  Move {item.title} to{' '}
                                  {col.id === cols[0]?.id
                                    ? (cols[1]?.label || 'another column')
                                    : (cols[0]?.label || 'another column')}{' '}
                                  in {row.label}
                                </span>
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className='text-muted-foreground/20 flex h-full min-h-[60px] items-center justify-center text-xs'>
                          -
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export namespace ScheduleRenderer {
  export interface Props {
    result: MimeResult;
  }

  export interface MimeResult {
    mimeType: 'application/vnd.openteams-schedule';
    data: {
      status: string;
      view: {
        title: string;
        row_label: string;
        col_label: string;
        item_label: string;
      };
      actions?: {
        label: string;
        prompt: string;
        icon: string;
      }[];
      axis: {
        rows: { id: string; label: string; sub_label?: string }[];
        columns: { id: string; label: string }[];
      };
      items: {
        id: string;
        row_id: string;
        col_id: string;
        title: string;
        subtitle?: string;
        footer?: string;
        details: { label: string; value: any; type?: 'list' }[];
      }[];
    };
  }
}
