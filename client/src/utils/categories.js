import { icons } from "../assets";

export const CATEGORIES = [
  { value: "gaming", label: "Gaming", icon: icons.gaming },
  { value: "automobiles", label: "Automobiles", icon: icons.automobiles },
  { value: "sports", label: "Sports", icon: icons.sports },
  { value: "entertainment", label: "Entertainment", icon: icons.entertainment },
  { value: "technology", label: "Technology", icon: icons.technology },
  { value: "music", label: "Music", icon: icons.music },
  { value: "blogs", label: "Blogs", icon: icons.blogs },
  { value: "news", label: "News", icon: icons.news },
  { value: "education", label: "Education", icon: null },
  { value: "travel", label: "Travel", icon: null },
  { value: "comedy", label: "Comedy", icon: null },
  { value: "howto", label: "How-to", icon: null },
  { value: "other", label: "Other", icon: null },
];

export const SIDEBAR_CATEGORIES = CATEGORIES.filter(
  (category) => category.icon,
);
