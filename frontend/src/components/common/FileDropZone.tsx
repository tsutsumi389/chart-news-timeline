import React, { useState, useRef, DragEvent } from 'react';

interface FileDropZoneProps {
  onDrop: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  maxSizeMB?: number;
}

/**
 * ファイルドロップゾーンコンポーネント
 * ドラッグ&ドロップまたはクリックでファイルを選択
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onDrop,
  accept = '.csv',
  disabled = false,
  maxSizeMB = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルバリデーション
  const validateFile = (file: File): string | null => {
    // ファイルサイズチェック
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `ファイルサイズが大きすぎます（最大: ${maxSizeMB}MB）`;
    }

    // 拡張子チェック
    const acceptedExtensions = accept.split(',').map((ext) => ext.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedExtensions.includes(fileExtension)) {
      return `許可されていないファイル形式です（許可: ${accept}）`;
    }

    return null;
  };

  // ファイル処理
  const handleFile = (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    onDrop(file);
  };

  // ドラッグ開始
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  // ドラッグ中
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ドラッグ終了
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // ドロップ
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  // ファイル選択
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // クリックでファイル選択
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={styles.container}>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          ...styles.dropZone,
          ...(isDragging ? styles.dropZoneDragging : {}),
          ...(disabled ? styles.dropZoneDisabled : {}),
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          style={styles.fileInput}
        />

        <div style={styles.iconContainer}>
          <span style={styles.icon}>📁</span>
        </div>

        <div style={styles.textContainer}>
          <p style={styles.primaryText}>
            {isDragging
              ? 'ファイルをドロップしてください'
              : 'ファイルをドラッグ&ドロップ'}
          </p>
          <p style={styles.secondaryText}>または、クリックしてファイルを選択</p>
        </div>

        <div style={styles.infoContainer}>
          <p style={styles.infoText}>対応形式: {accept}</p>
          <p style={styles.infoText}>最大サイズ: {maxSizeMB}MB</p>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}
    </div>
  );
};

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  dropZone: {
    border: '2px dashed #1976d2',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  dropZoneDragging: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1565c0',
    transform: 'scale(1.02)',
  },
  dropZoneDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#eeeeee',
  },
  fileInput: {
    display: 'none',
  },
  iconContainer: {
    marginBottom: '16px',
  },
  icon: {
    fontSize: '48px',
  },
  textContainer: {
    marginBottom: '16px',
  },
  primaryText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  secondaryText: {
    fontSize: '14px',
    color: '#666',
  },
  infoContainer: {
    marginTop: '16px',
  },
  infoText: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '4px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    marginTop: '12px',
  },
  errorIcon: {
    marginRight: '8px',
    fontSize: '16px',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '14px',
  },
};
