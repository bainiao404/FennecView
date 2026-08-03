# Spine 资源拖拽导入报错问题归纳

## 1. 问题现象
当用户在浏览器中拖拽包含 Spine 资源的文件夹（包含 `.skel` / `.json`、`.atlas`、`.png`）进行导入时，浏览器控制台抛出如下错误：
```log
加载Spine资源失败: Error: Failed to load image from blob URL: blob:http://localhost:5173/77842a81-d7f5-4a6b-863b-1fade379ac91
    at e.onerror (index.ts:179:40)
```
但在单独导入该 `.png` 图片资源时，图片可以正常加载渲染，没有任何报错。

---

## 2. 根本原因分析

该问题由两个独立的底层原因共同交织触发：

### 原因 A：同名非图片文件被错误识别为纹理（核心逻辑 bug）
在 `SpineProcessor.js` 的 `group()` 方法中，负责为图集依赖项（例如 `5002.png`）在文件池中匹配对应文件的逻辑如下：
```javascript
let texFile = pool.find(f => {
    ...
    const fNameNoExt = fName.substring(0, fName.lastIndexOf('.'));
    const tNameNoExt = tName.includes('.') ? tName.substring(0, tName.lastIndexOf('.')) : tName;
    return fNameNoExt === tNameNoExt;
});
```
* **问题**：在去除后缀名匹配时，逻辑没有对文件本身是否属于图片类型做校验。
* **后果**：如果要寻找 `5002.png`（`tNameNoExt` 是 `"5002"`），而文件池中刚好同时存在图集文本文件 `5002.atlas`（`fNameNoExt` 也是 `"5002"`）。如果 `5002.atlas` 在数组中的排序刚好在 `5002.png` 之前，则会被错误判定为匹配的纹理文件，并将其 Blob URL 放入纹理映射表 `imageBlobMaps` 中。

### 原因 B：Chrome 对 `blob:` 协议下 Image 加载的严格 MIME 校验限制
* 当 PixiJS 独立的 Image 渲染管线加载单独图片时，底层使用的是 `createImageBitmap` 和 `fetch`，它们在抓取 Blob URL 时**不强制检验 MIME 类型**，可以直接读取到二进制数据进行解码。
* 而 `simple-pixi-spine` 插件内部加载 `blob:` 类型纹理时，使用的是传统的 DOM `new Image()` 进行赋值加载：
  ```javascript
  let e = new Image;
  e.src = A; // A 是 blob URL
  ```
  在 Chrome 浏览器中，如果 `new Image().src` 指向的 `blob:` 资源没有正确的图片 MIME 协议头（例如被识别为 `text/plain` 的 `.atlas` 的 Blob 资源，或是拖拽文件夹获取到的空 MIME 类型 `""`），浏览器将出于安全限制直接**拒绝解码图片并触发 `onerror` 报错**。

---

## 3. 修复方案

1. **后缀白名单过滤限制**：
   在 `SpineProcessor.js` 的匹配逻辑中，加入严格的图片后缀校验，过滤掉一切非图片后缀的重名匹配项：
   ```javascript
   // 只有当文件本身具有图片后缀时，才允许进入去除后缀匹配逻辑
   if (!/\.(png|jpg|jpeg|webp|gif|webg)$/i.test(fName)) return false;
   ```
   该项修复从源头上阻止了图集描述文件（`.atlas`）被错误伪装成纹理文件。

2. **保留安全的 Blob MIME 类型强转机制**：
   为了防止文件夹拖拽中 `File.type` 获取为空导致的图片加载异常，在 `FileItem.js` 中使用不破坏临时文件系统读取流的 `Blob` 包裹形式，按需将空类型文件重新包装为对应的图片类型：
   ```javascript
   if (mimeType && mimeType !== rawFile.type) {
       return new Blob([rawFile], { type: mimeType });
   }
   ```
