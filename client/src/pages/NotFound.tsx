import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
      <Card className="w-full max-w-lg mx-4 shadow-sm border border-slate-200 bg-white rounded-xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-slate-900 mb-1.5 font-mono tabular-nums">404</h1>

          <h2 className="text-base font-semibold text-slate-700 mb-3">
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Halaman yang Anda tuju tidak tersedia atau tautan telah dipindahkan.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-[#0F172A] hover:bg-slate-800 text-white px-5 py-2 rounded-md font-medium text-xs transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
