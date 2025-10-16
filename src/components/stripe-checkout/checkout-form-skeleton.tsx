import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

export default function CheckoutFormSkeleton() {
  return (
    <form className="twp space-y-6 max-w-2xl mx-auto">
      {/* Summary */}
      <div>
        <div className="font-bold mb-2 text-lg">Summary:</div>
        <ul className="space-y-1">
          <li className="flex justify-between items-center">
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
            </div>
            <Skeleton className="h-4 w-16" />
          </li>
          <li className="flex justify-between items-center">
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
            </div>
            <Skeleton className="h-4 w-16" />
          </li>
        </ul>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-y-1">
          <span className="text-muted-foreground">Subtotal:</span>
          <Skeleton className="h-4 w-16 justify-self-end" />
          <span className="text-muted-foreground">Tax:</span>
          <Skeleton className="h-4 w-16 justify-self-end" />
          <span className="font-bold text-lg">Total:</span>
          <Skeleton className="h-5 w-24 font-mono justify-self-end" />
        </div>
      </div>

      {/* Customer information */}
      <div>
        <div className="font-bold mb-2">Customer information:</div>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1 block"
          >
            Email
          </label>
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="mb-4">
          <label
            htmlFor="fullName"
            className="mb-1 block"
          >
            Full name
          </label>
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="mb-4">
          <label
            htmlFor="country"
            className="mb-1 block"
          >
            Country or region
          </label>
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="mb-4">
          <label
            htmlFor="address"
            className="mb-1 block"
          >
            Address
          </label>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Payment */}
      <div>
        <div className="mb-1">Payment</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="mb-2">
          <label
            htmlFor="cardNumber"
            className="mb-1 block"
          >
            Card number
          </label>
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label
              htmlFor="expirationDate"
              className="mb-1 block"
            >
              Expiration date
            </label>
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex-1">
            <label
              htmlFor="securityCode"
              className="mb-1 block"
            >
              Security code
            </label>
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>

      {/* Cancel and Pay buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </form>
  );
}
