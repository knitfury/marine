import { Avatar, type AvatarProps } from "@/components/ui/avatar";

export interface EntityAvatarProps {
  /** Dealer/customer/equipment/user display name - initials are derived from this. */
  name: string;
  imageUrl?: string;
  size?: AvatarProps["size"];
  className?: string;
}

/**
 * Thin domain-facing wrapper over the `Avatar` UI primitive, used for
 * dealers, customers, equipment and users alike - any entity that just
 * needs "a circle with initials (or a photo)".
 */
export function EntityAvatar({ name, imageUrl, size, className }: EntityAvatarProps) {
  return <Avatar name={name} src={imageUrl} size={size} className={className} />;
}
