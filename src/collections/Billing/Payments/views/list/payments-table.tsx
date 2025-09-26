"use client";

import { toast, useAuth } from "@payloadcms/ui";
import {
  type ColumnDef,
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { formatRelative } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import * as React from "react";
import type Stripe from "stripe";
import { convertCentsToDollars } from "@/collections/Events/utils/convertCentsToDollars";
import { formatDate } from "@/components/calendar/utils/format-date";
import StripeConnect from "@/components/stripe-connect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createStripeAccountSession } from "@/lib/stripe/account-sessions";
import type { ConnectedAccount } from "@/payload-types";
import { extractID } from "@/utilities/extractID";
import { isNonNull } from "@/utilities/isNonNull";
import PaymentDetails from "./payment-details";
import { isTypedObject } from "@/utilities/isTypedObject";

const columnHelper = createColumnHelper<Stripe.Checkout.Session>();

export const columns = [
  // columnHelper.display({
  //   id: "select",
  //   enableSorting: false,
  //   enableHiding: false,
  //   meta: {
  //     size: 40,
  //   },
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && "indeterminate")
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  // }),
  columnHelper.accessor("created", {
    meta: {
      size: 0,
    },
    header: "Created",
    cell: ({ row }) => {
      const created = row.getValue("created") as number;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="first-letter:capitalize w-fit">
              {formatRelative(new Date(created * 1000), new Date())}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            {formatDate(new Date(created * 1000))}
          </TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("payment_intent", {
    meta: {
      size: 0,
    },
    header: "Paid on",
    cell: ({ row, getValue }) => {
      const intent = getValue();

      const fullIntent = isTypedObject(intent) ? intent : null;

      if (!fullIntent) return <div>-</div>;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="first-letter:capitalize w-fit">
              {formatRelative(new Date(fullIntent.created * 1000), new Date())}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            {formatDate(new Date(fullIntent.created * 1000))}
          </TooltipContent>
        </Tooltip>
      );
    },
  }),
  columnHelper.accessor("status", {
    meta: {
      size: 0,
    },
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Stripe.Checkout.Session.Status;
      const statusLabel = status.replaceAll("_", " ").toLowerCase();

      const mapStatusToVariant: Partial<
        Record<
          Stripe.Checkout.Session.Status,
          Parameters<typeof Badge>[0]["variant"]
        >
      > = {
        complete: "success",
        expired: "destructive",
        open: "warning",
      };

      return (
        <Badge
          variant={mapStatusToVariant[status] ?? "default"}
          className="first-letter:capitalize block text-sm min-w-24 text-center"
        >
          {statusLabel}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("line_items", {
    // TODO: read this resource from config
    header: "Items",
    cell: ({ getValue }) => {
      const lineItems = getValue();

      if (!lineItems) return <div>-</div>;

      if (lineItems.data.length === 1) {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log(lineItems.data[0]);
            }}
          >
            {lineItems.data[0].description}
          </Button>
        );
      }

      return <div>Items</div>;
    },
  }),
  columnHelper.accessor("customer.email", {
    id: "customer.email",
    // header: ({ column }) => {
    //   return (
    //     <Button
    //       variant="ghost"
    //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    //     >
    //       Email
    //       <ArrowUpDown />
    //     </Button>
    //   );
    // },
    header: "Email",
    cell: ({ getValue }) => {
      const email = getValue() as string;

      if (!email) return <div>-</div>;

      return <div className="lowercase">{email || "N/A"}</div>;
    },
  }),
  columnHelper.accessor("amount_total", {
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row, getValue }) => {
      const amount = getValue();
      if (typeof amount !== "number") return <div>-</div>;

      const currency = row.original.currency;

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency?.toUpperCase() || "USD",
      }).format(convertCentsToDollars(amount));

      return <div className="text-right font-medium">{formatted}</div>;
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    meta: {
      size: 40,
    },
    cell: ({ row, table }) => {
      const payment = row.original;

      const setSelectedPaymentIntentId =
        // @ts-expect-error this exists but not typed via global meta types
        table.options.meta?.setSelectedPaymentIntentId as (
          paymentIntentId: string
        ) => void;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                try {
                  navigator.clipboard.writeText(payment.id);
                  toast.success("Payment ID copied to clipboard");
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to copy payment ID");
                }
              }}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (row.original.payment_intent) {
                  // We don't expand the payment intent, and so it is a string
                  setSelectedPaymentIntentId(
                    row.original.payment_intent as string
                  );
                } else {
                  toast.error("No payment intent found");
                }
              }}
            >
              View payment details
            </DropdownMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem>Start refund</DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent>
                To start a refund for this payment, open the payment details and
                click the "Start refund" button.
              </TooltipContent>
            </Tooltip>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];

function hasStripeAccountId(
  account: ConnectedAccount | null | undefined
): account is ConnectedAccount & { stripeAccountId: string } {
  return isNonNull(account) && typeof account.stripeAccountId === "string";
}

function isExpandedCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer | string
): customer is Stripe.Customer | Stripe.DeletedCustomer {
  return isNonNull(customer);
}

const getCellSize = (columnDef: ColumnDef<Stripe.Checkout.Session>) => {
  const { autoWidth, size } = (columnDef.meta ?? {}) as {
    autoWidth?: boolean;
    size?: number | string;
  };

  if (autoWidth) {
    return "100%";
  }

  return size;
};

export function PaymentsTable({
  data = [],
  account,
}: {
  data?: Stripe.Checkout.Session[];
  account?: ConnectedAccount | null;
}) {
  const { user } = useAuth();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedPaymentIntentId, setSelectedPaymentIntentId] = React.useState<
    string | null
  >(null);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      setSelectedPaymentIntentId,
    },
  });

  const tenant = account?.tenant ? extractID(account.tenant) : null;

  const showPaymentDetails = !!isNonNull(selectedPaymentIntentId);

  const hasStripeDetails = !!(
    isNonNull(user) &&
    hasStripeAccountId(account) &&
    isNonNull(tenant)
  );

  return (
    <div className="w-full twp">
      {hasStripeDetails && (
        <StripeConnect
          fetchClientSecret={async () => {
            const res = await createStripeAccountSession(user, {
              account: account?.stripeAccountId,
              tenant,
              components: {
                payment_details: {
                  enabled: true,
                },
              },
            });

            return res.clientSecret;
          }}
        >
          {showPaymentDetails ? (
            <PaymentDetails
              paymentIntentOrChargeId={selectedPaymentIntentId}
              onClose={() => setSelectedPaymentIntentId(null)}
            />
          ) : null}
        </StripeConnect>
      )}

      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={
            (table.getColumn("customer.email")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) =>
            table
              .getColumn("customer.email")
              ?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-auto"
            >
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
      <div className="overflow-hidden rounded border">
        <Table className="text-base">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: getCellSize(header.column.columnDef),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: getCellSize(cell.column.columnDef),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {/* <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div> */}
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
