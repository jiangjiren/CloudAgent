import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Extension } from '@codemirror/state';
import { useEffect, useState } from 'react';

import { api } from '../../../../utils/api';

import MarkdownPreview from './markdown/MarkdownPreview';

type CodeEditorSurfaceProps = {
  content: string;
  onChange: (value: string) => void;
  markdownPreview: boolean;
  isMarkdownFile: boolean;
  htmlPreview: boolean;
  isHtmlFile: boolean;
  htmlPreviewTitle: string;
  htmlPreviewProjectId?: string;
  htmlPreviewSourcePath?: string;
  isDarkMode: boolean;
  fontSize: number;
  showLineNumbers: boolean;
  extensions: Extension[];
};

type HtmlPreviewDocumentResult = {
  html: string;
};

const URL_SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
const CSS_URL_PATTERN = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;

const shouldRewriteLocalResourceUrl = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed.length > 0
    && !trimmed.startsWith('#')
    && !trimmed.startsWith('//')
    && !URL_SCHEME_PATTERN.test(trimmed)
  );
};

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getDirectoryPath = (filePath: string) => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const lastSlashIndex = normalizedPath.lastIndexOf('/');
  return lastSlashIndex === -1 ? '' : normalizedPath.slice(0, lastSlashIndex + 1);
};

const splitResourceUrl = (resourceUrl: string) => {
  const hashIndex = resourceUrl.indexOf('#');
  const beforeHash = hashIndex === -1 ? resourceUrl : resourceUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : resourceUrl.slice(hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  const pathPart = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);

  return {
    pathPart,
    hash,
  };
};

const resolvePreviewResourcePath = (resourceUrl: string, sourcePath: string) => {
  const { pathPart } = splitResourceUrl(resourceUrl.trim());

  if (pathPart.startsWith('/')) {
    return safeDecodeURIComponent(pathPart.slice(1));
  }

  const sourceDirectory = getDirectoryPath(sourcePath);
  const sourceIsAbsolute = sourceDirectory.startsWith('/');
  const basePath = sourceIsAbsolute ? sourceDirectory : `/${sourceDirectory}`;
  const resolvedUrl = new URL(pathPart, `https://cloudcli.local${basePath}`);
  const resolvedPath = sourceIsAbsolute ? resolvedUrl.pathname : resolvedUrl.pathname.replace(/^\//, '');

  return safeDecodeURIComponent(resolvedPath);
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

const createDataUrl = (bytes: Uint8Array, contentType: string) => {
  return `data:${contentType || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`;
};

const rewriteCssUrls = async (
  cssText: string,
  projectId: string,
  sourcePath: string,
) => {
  let result = '';
  let lastIndex = 0;
  const matches = Array.from(cssText.matchAll(CSS_URL_PATTERN));

  for (const match of matches) {
    const matchIndex = match.index ?? 0;
    const originalUrl = match[2];

    result += cssText.slice(lastIndex, matchIndex);

    if (shouldRewriteLocalResourceUrl(originalUrl)) {
      const rewrittenUrl = await createDataUrlForResource(originalUrl, projectId, sourcePath);
      result += `url("${rewrittenUrl}")`;
    } else {
      result += match[0];
    }

    lastIndex = matchIndex + match[0].length;
  }

  return result + cssText.slice(lastIndex);
};

const createDataUrlForResource = async (
  resourceUrl: string,
  projectId: string,
  sourcePath: string,
  options: { rewriteCss?: boolean } = {},
) => {
  try {
    const { hash } = splitResourceUrl(resourceUrl.trim());
    const resolvedPath = resolvePreviewResourcePath(resourceUrl, sourcePath);
    const response = await api.readFileBlob(projectId, resolvedPath);

    if (!response.ok) {
      return resourceUrl;
    }

    const contentType = response.headers.get('content-type') || '';
    const shouldRewriteCss = options.rewriteCss || contentType.includes('text/css') || resolvedPath.toLowerCase().endsWith('.css');
    const dataUrl = shouldRewriteCss
      ? createDataUrl(
        new TextEncoder().encode(await rewriteCssUrls(await response.text(), projectId, resolvedPath)),
        contentType || 'text/css',
      )
      : createDataUrl(new Uint8Array(await response.arrayBuffer()), contentType);

    return `${dataUrl}${hash}`;
  } catch {
    return resourceUrl;
  }
};

const rewriteSrcset = async (
  srcset: string,
  projectId: string,
  sourcePath: string,
) => {
  if (srcset.includes('data:')) {
    return srcset;
  }

  const candidates = srcset.split(',');
  const rewrittenCandidates = await Promise.all(candidates.map(async (candidate) => {
    const trimmedCandidate = candidate.trim();
    const firstWhitespaceIndex = trimmedCandidate.search(/\s/);
    const url = firstWhitespaceIndex === -1 ? trimmedCandidate : trimmedCandidate.slice(0, firstWhitespaceIndex);
    const descriptor = firstWhitespaceIndex === -1 ? '' : trimmedCandidate.slice(firstWhitespaceIndex);

    if (!shouldRewriteLocalResourceUrl(url)) {
      return candidate;
    }

    return `${await createDataUrlForResource(url, projectId, sourcePath)}${descriptor}`;
  }));

  return rewrittenCandidates.join(', ');
};

const shouldRewriteHrefAttribute = (element: Element) => {
  const tagName = element.tagName.toLowerCase();
  return tagName === 'link' || tagName === 'image' || tagName === 'use';
};

const createHtmlPreviewDocument = async (
  content: string,
  projectId: string,
  sourcePath: string,
): Promise<HtmlPreviewDocumentResult> => {
  const parser = new DOMParser();
  const document = parser.parseFromString(content, 'text/html');
  const rewriteTasks: Array<Promise<void>> = [];

  document.querySelectorAll('*').forEach((element) => {
    const rewriteAttribute = (attributeName: string, options: { rewriteCss?: boolean } = {}) => {
      const value = element.getAttribute(attributeName);
      if (!value || !shouldRewriteLocalResourceUrl(value)) {
        return;
      }

      rewriteTasks.push((async () => {
        element.setAttribute(attributeName, await createDataUrlForResource(value, projectId, sourcePath, options));
      })());
    };

    rewriteAttribute('src');
    rewriteAttribute('poster');

    if (element.tagName.toLowerCase() === 'object') {
      rewriteAttribute('data');
    }

    if (shouldRewriteHrefAttribute(element)) {
      rewriteAttribute('href', { rewriteCss: element.tagName.toLowerCase() === 'link' });
      rewriteAttribute('xlink:href');
    }

    const srcset = element.getAttribute('srcset');
    if (srcset) {
      rewriteTasks.push((async () => {
        element.setAttribute('srcset', await rewriteSrcset(srcset, projectId, sourcePath));
      })());
    }

    const style = element.getAttribute('style');
    if (style) {
      rewriteTasks.push((async () => {
        element.setAttribute('style', await rewriteCssUrls(style, projectId, sourcePath));
      })());
    }
  });

  document.querySelectorAll('style').forEach((styleElement) => {
    const cssText = styleElement.textContent;
    if (!cssText) {
      return;
    }

    rewriteTasks.push((async () => {
      styleElement.textContent = await rewriteCssUrls(cssText, projectId, sourcePath);
    })());
  });

  await Promise.all(rewriteTasks);

  const doctype = content.trimStart().toLowerCase().startsWith('<!doctype') ? '<!doctype html>\n' : '';
  return {
    html: `${doctype}${document.documentElement.outerHTML}`,
  };
};

export default function CodeEditorSurface({
  content,
  onChange,
  markdownPreview,
  isMarkdownFile,
  htmlPreview,
  isHtmlFile,
  htmlPreviewTitle,
  htmlPreviewProjectId,
  htmlPreviewSourcePath,
  isDarkMode,
  fontSize,
  showLineNumbers,
  extensions,
}: CodeEditorSurfaceProps) {
  const [htmlPreviewDocument, setHtmlPreviewDocument] = useState(content);

  useEffect(() => {
    if (!htmlPreview || !isHtmlFile || !htmlPreviewProjectId || !htmlPreviewSourcePath) {
      setHtmlPreviewDocument(content);
      return undefined;
    }

    let disposed = false;

    createHtmlPreviewDocument(content, htmlPreviewProjectId, htmlPreviewSourcePath)
      .then(({ html }) => {
        if (disposed) {
          return;
        }

        setHtmlPreviewDocument(html);
      })
      .catch((error) => {
        console.error('Failed to prepare HTML preview assets:', error);
        if (!disposed) {
          setHtmlPreviewDocument(content);
        }
      });

    return () => {
      disposed = true;
    };
  }, [content, htmlPreview, htmlPreviewProjectId, htmlPreviewSourcePath, isHtmlFile]);

  if (markdownPreview && isMarkdownFile) {
    return (
      <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
        <div className="prose prose-sm mx-auto max-w-4xl max-w-none px-8 py-6 dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600 prose-code:text-sm prose-pre:bg-gray-900 prose-img:rounded-lg dark:prose-a:text-blue-400">
          <MarkdownPreview content={content} />
        </div>
      </div>
    );
  }

  if (htmlPreview && isHtmlFile) {
    return (
      <iframe
        title={htmlPreviewTitle}
        srcDoc={htmlPreviewDocument}
        sandbox="allow-forms allow-modals allow-popups allow-scripts"
        referrerPolicy="no-referrer"
        className="h-full w-full border-0 bg-white"
      />
    );
  }

  return (
    <CodeMirror
      value={content}
      onChange={onChange}
      extensions={extensions}
      theme={isDarkMode ? oneDark : undefined}
      height="100%"
      style={{
        fontSize: `${fontSize}px`,
        height: '100%',
      }}
      basicSetup={{
        lineNumbers: showLineNumbers,
        foldGutter: true,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
        highlightSelectionMatches: true,
        searchKeymap: true,
      }}
    />
  );
}
