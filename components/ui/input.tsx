import * as React from "react";

import { cn } from "@/lib/utils";

<<<<<<< HEAD
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}
=======
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
>>>>>>> 65d1fdd994ea331c20263c70f824dc1d644ebec0

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
<<<<<<< HEAD
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
=======
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          className,
>>>>>>> 65d1fdd994ea331c20263c70f824dc1d644ebec0
        )}
        ref={ref}
        {...props}
      />
    );
<<<<<<< HEAD
  }
=======
  },
>>>>>>> 65d1fdd994ea331c20263c70f824dc1d644ebec0
);
Input.displayName = "Input";

export { Input };
