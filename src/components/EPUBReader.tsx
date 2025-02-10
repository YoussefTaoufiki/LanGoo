import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';

interface SpineItem {
  idref: string;
}

interface ManifestItem {
  href: string;
  id: string;
}

interface EPUBReaderProps {
  filePath: string;
  onError?: (error: string) => void;
  onLocationChange?: (location: string) => void;
  onTextSelection?: (text: string, isLongPress: boolean) => void;
  initialLocation?: string;
  style?: any;
  settings: {
    fontSize: number;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'justify';
    lineHeight: number;
    letterSpacing: number;
    paragraphSpacing: number;
    marginHorizontal: number;
    theme: 'light' | 'dark' | 'sepia';
  };
}

export const EPUBReader: React.FC<EPUBReaderProps> = ({
  filePath,
  onError,
  onLocationChange,
  onTextSelection,
  initialLocation,
  style,
  settings,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    const extractAndReadEPUB = async () => {
      try {
        // Create a temporary directory for extraction
        const tempDir = `${RNFS.CachesDirectoryPath}/epub_temp_${Date.now()}`;
        await RNFS.mkdir(tempDir);

        // Extract EPUB file
        await unzip(filePath, tempDir);

        // Read container.xml to find OPF file location
        const containerXml = await RNFS.readFile(`${tempDir}/META-INF/container.xml`, 'utf8');
        const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
        
        if (!opfPath) {
          throw new Error('Could not find OPF file path');
        }

        // Read OPF file
        const opfContent = await RNFS.readFile(`${tempDir}/${opfPath}`, 'utf8');
        
        // Parse spine and manifest
        const spineItems: SpineItem[] = (opfContent.match(/idref="([^"]+)"/g) || []).map(item => ({
          idref: item.match(/idref="([^"]+)"/)?.[1] || '',
        }));

        const manifestItems: ManifestItem[] = (opfContent.match(/href="([^"]+)"/g) || []).map(item => ({
          href: item.match(/href="([^"]+)"/)?.[1] || '',
          id: item.match(/id="([^"]+)"/)?.[1] || '',
        }));

        // Read chapter contents
        const chapterContents: string[] = await Promise.all(
          manifestItems.map(async item => {
            const chapterPath = `${tempDir}/${item.href}`;
            try {
              return await RNFS.readFile(chapterPath, 'utf8');
            } catch (error) {
              console.error(`Error reading chapter ${item.href}:`, error);
              return '';
            }
          })
        );

        // Create HTML content
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: ${settings.fontFamily};
                  font-size: ${settings.fontSize}px;
                  line-height: ${settings.lineHeight};
                  text-align: ${settings.textAlign};
                  letter-spacing: ${settings.letterSpacing}px;
                  margin: 0 ${settings.marginHorizontal}px;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                p {
                  margin-bottom: ${settings.paragraphSpacing}px;
                }
                .chapter {
                  margin-bottom: 2em;
                }
              </style>
              <script>
                document.addEventListener('selectionchange', () => {
                  const selection = window.getSelection();
                  if (selection && selection.toString()) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'selection',
                      text: selection.toString(),
                      isLongPress: false,
                    }));
                  }
                });

                document.addEventListener('scroll', () => {
                  const progress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'location',
                    location: progress.toString(),
                  }));
                });

                if (${initialLocation}) {
                  const targetScroll = ${initialLocation} * (document.documentElement.scrollHeight - window.innerHeight);
                  window.scrollTo(0, targetScroll);
                }
              </script>
            </head>
            <body>
              ${chapterContents.map((content, index) => `
                <div id="chapter-${index}" class="chapter">
                  ${content}
                </div>
              `).join('')}
            </body>
          </html>
        `;

        setHtmlContent(html);

        // Clean up temporary directory
        await RNFS.unlink(tempDir);
      } catch (error) {
        console.error('Error processing EPUB:', error);
        onError?.(error instanceof Error ? error.message : 'Error processing EPUB file');
      }
    };

    extractAndReadEPUB();
  }, [filePath, onError, settings, initialLocation]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'selection') {
        onTextSelection?.(data.text, data.isLongPress);
      } else if (data.type === 'location') {
        onLocationChange?.(data.location);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  if (!htmlContent) {
    return <View style={styles.container} />;
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
}); 