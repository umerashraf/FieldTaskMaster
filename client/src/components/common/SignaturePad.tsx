import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  label?: string;
  width?: number;
  height?: number;
}

export default function SignaturePad({ 
  onSave, 
  label = "Signature", 
  width = 500, 
  height = 200 
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsSigned(false);
    }
  };

  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      onSave(dataURL);
    }
  };

  const handleBegin = () => {
    setIsSigned(true);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-2 text-sm font-medium text-neutral-700">{label}</div>
      <div className="border border-neutral-300 rounded-md overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas w-full',
            style: { width: '100%', height: `${height}px` }
          }}
          onBegin={handleBegin}
        />
      </div>
      <div className="flex justify-between mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          className="flex items-center"
        >
          <Eraser className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={save}
          disabled={!isSigned}
          className="flex items-center"
        >
          <Check className="h-4 w-4 mr-1" />
          Save Signature
        </Button>
      </div>
    </div>
  );
}