import type { Metadata } from "next";
import SVGCircles from "@/exp/SVGCircles";

export const metadata: Metadata = {
  title: "Exp",
  description: "Scratch route",
};

export default function ExpPage() {
  return (
    <div className="w-full h-full">
      <SVGCircles />
    </div>
  );
}
