import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

const ImageCropper: React.FC<any> = () => null;
type ImageType = 'PROFILE' | 'BANNER';

interface ImageUploadProps {
  previewUrl: string | null;
  isLoading?: boolean;
  error?: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
  className?: string;
  imageClassName?: string;
  imageContainerClassName?: string;
  uploadButtonClassName?: string;
  showCropper?: boolean;
  pendingFile?: File | null;
  imageType?: ImageType;
  onCropComplete?: (croppedBlob: Blob) => void;
  onCancelCrop?: () => void;
}

export const ImageUpload = ({
  previewUrl,
  isLoading = false,
  error,
  onPickImage,
  onRemoveImage,
  className,
  imageClassName,
  imageContainerClassName,
  uploadButtonClassName,
  showCropper = false,
  pendingFile = null,
  imageType = 'PROFILE',
  onCropComplete,
  onCancelCrop,
}: ImageUploadProps) => {
  return (
    <>
      <div className={cn('w-full', className)}>
        {previewUrl ? (
          <div
            className={cn(
              'relative w-full rounded-lg overflow-hidden border',
              imageContainerClassName
            )}
            style={imageType === 'PROFILE' ? { aspectRatio: '1/1' } : undefined}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className={cn(
                imageType === 'PROFILE' ? 'w-full h-full object-cover' : 'w-full h-auto block',
                imageClassName
              )}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={onRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <Button
              type="button"
              variant="outline"
              className={cn('w-full h-32 flex flex-col gap-2', uploadButtonClassName)}
              onClick={onPickImage}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="flex gap-2">
                  <Camera className="h-6 w-6" />
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>

      {showCropper && pendingFile && onCropComplete && onCancelCrop && (
        <ImageCropper
          imageFile={pendingFile}
          imageType={imageType === 'PROFILE' ? 'profile' : 'post'}
          onCropComplete={onCropComplete}
          onCancel={onCancelCrop}
        />
      )}
    </>
  );
};
