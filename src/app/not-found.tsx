import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <div className="text-center">
        <div className="text-6xl font-semibold tracking-tight text-accent tnum">
          404
        </div>
        <h1 className="mt-2 text-xl font-semibold">ไม่พบหน้านี้</h1>
        <p className="mt-1 text-muted">
          Mock Test หรือหน้าที่คุณกำลังหาอาจถูกลบหรือย้ายไปแล้ว
        </p>
        <Link href="/" className="mt-5 inline-block">
          <Button>กลับหน้าหลัก</Button>
        </Link>
      </div>
    </div>
  );
}
