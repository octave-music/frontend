interface StreamProgress {
    bytesLoaded: number;
    totalBytes: number;
    progress: number;
  }
  
  type ProgressCallback = (progress: StreamProgress) => void;
  
  export class AudioStreamer {
    private mediaSource: MediaSource;
    private sourceBuffer: SourceBuffer | null = null;
    private queuedSegments: ArrayBuffer[] = [];
    private isBuffering = false;
    private abortController: AbortController | null = null;
    private readonly CHUNK_SIZE = 64 * 1024; // 64KB chunks
    private initialized = false;
    private currentObjectUrl: string | null = null;
  
    constructor(
      private audioElement: HTMLAudioElement,
      private onProgress?: ProgressCallback
    ) {
      this.mediaSource = new MediaSource();
    }
  
    private async initializeMediaSource(): Promise<void> {
      if (this.initialized) return;
  
      // Clean up any existing object URL
      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
      }
  
      try {
        this.mediaSource = new MediaSource();
        this.currentObjectUrl = URL.createObjectURL(this.mediaSource);
        this.audioElement.src = this.currentObjectUrl;
  
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('MediaSource initialization timeout'));
          }, 3000);
  
          const handleSourceOpen = () => {
            clearTimeout(timeoutId);
            this.mediaSource.removeEventListener('sourceopen', handleSourceOpen);
            
            try {
              this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
              this.sourceBuffer.mode = 'sequence';
              this.sourceBuffer.addEventListener('updateend', () => this.appendNextSegment());
              this.initialized = true;
              resolve();
            } catch (error) {
              reject(error);
            }
          };
  
          this.mediaSource.addEventListener('sourceopen', handleSourceOpen);
        });
      } catch (error) {
        this.initialized = false;
        throw error;
      }
    }
  
    async streamAudio(url: string): Promise<void> {
      await this.initializeMediaSource();
      
      this.abortController = new AbortController();
  
      try {
        const response = await fetch(url, {
          signal: this.abortController.signal
        });
  
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        if (!response.body) throw new Error('ReadableStream not supported');
  
        const reader = response.body.getReader();
        const contentLength = Number(response.headers.get('Content-Length')) || 0;
        let receivedLength = 0;
        let chunks: Uint8Array[] = [];
  
        // Initial buffer load
        const initialBufferSize = Math.min(256 * 1024, contentLength);
        while (receivedLength < initialBufferSize) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
  
          if (receivedLength >= this.CHUNK_SIZE) {
            const segment = this.concatenateChunks(chunks);
            this.queuedSegments.push(segment);
            await this.appendNextSegment();
            chunks = [];
          }
        }
  
        // Stream remaining content
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
  
          if (chunks.length * value.length >= this.CHUNK_SIZE) {
            const segment = this.concatenateChunks(chunks);
            this.queuedSegments.push(segment);
            chunks = [];
  
            if (!this.isBuffering) {
              await this.appendNextSegment();
            }
          }
  
          this.onProgress?.({
            bytesLoaded: receivedLength,
            totalBytes: contentLength,
            progress: (receivedLength / contentLength) * 100
          });
        }
  
        if (chunks.length > 0) {
          const segment = this.concatenateChunks(chunks);
          this.queuedSegments.push(segment);
          if (!this.isBuffering) {
            await this.appendNextSegment();
          }
        }
  
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        this.handleError(error as Error);
        throw error;
      }
    }
  
    private concatenateChunks(chunks: Uint8Array[]): ArrayBuffer {
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result.buffer;
    }
  
    private async appendNextSegment(): Promise<void> {
      if (!this.sourceBuffer || this.sourceBuffer.updating || this.queuedSegments.length === 0) {
        this.isBuffering = false;
        return;
      }
  
      this.isBuffering = true;
      const segment = this.queuedSegments.shift();
      
      if (segment) {
        try {
          this.sourceBuffer.appendBuffer(segment);
        } catch (error) {
          console.error('Error appending buffer:', error);
          this.handleError(error as Error);
        }
      }
    }
  
    private handleError(error: Error): void {
      console.error('AudioStreamer error:', error);
      // Don't cleanup here, let the caller handle it
      this.audioElement.dispatchEvent(new ErrorEvent('error', { error }));
    }
  
    abort(): void {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      
      if (this.sourceBuffer && !this.sourceBuffer.updating) {
        try {
          this.sourceBuffer.abort();
        } catch (error) {
          console.warn('Error aborting source buffer:', error);
        }
      }
    }
  
    destroy(): void {
      this.abort();
      this.queuedSegments = [];
      this.isBuffering = false;
  
      if (this.mediaSource.readyState === 'open') {
        try {
          this.mediaSource.endOfStream();
        } catch (error) {
          console.warn('Error ending media source stream:', error);
        }
      }
  
      // Only revoke the URL after a short delay to ensure playback has properly switched
      if (this.currentObjectUrl) {
        const urlToRevoke = this.currentObjectUrl;
        setTimeout(() => {
          URL.revokeObjectURL(urlToRevoke);
        }, 1000);
        this.currentObjectUrl = null;
      }
    }
  }