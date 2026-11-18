import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/botly/App/word3d';
const uiPath = path.join(projectRoot, 'src/components/ui/GameUI.tsx');
let uiCode = fs.readFileSync(uiPath, 'utf8');

// 1. Add props to GameUIProps
uiCode = uiCode.replace(
  `  isDraggingFile: boolean;
  onOpenLibrary: () => void;
}`,
  `  isDraggingFile: boolean;
  onOpenLibrary: () => void;
  onBlendSelectedColor?: () => void;
  onBlendAllColors?: () => void;
}`
);

// 2. Destructure in GameUI component
uiCode = uiCode.replace(
  `  onOpenLibrary,
  isDraggingFile,
}: GameUIProps`,
  `  onOpenLibrary,
  isDraggingFile,
  onBlendSelectedColor,
  onBlendAllColors,
}: GameUIProps`
);

// 3. Add "Lên Màu Cảnh" in top editor bar
uiCode = uiCode.replace(
  `          <button
            className="btn-editor-action"
            onClick={() => {
              onSaveLayout();
              handleAction('Đã lưu bố cục làng thành công!');
            }}`,
  `          <button
            className="btn-editor-action"
            onClick={() => {
              onBlendAllColors?.();
              handleAction('Đã quét và lên màu tự nhiên cho tất cả núi đá!');
            }}
            title="Tự động lên màu cỏ xanh & đá xám cho tất cả núi/đá untextured"
            style={{
              background: 'rgba(22, 163, 74, 0.3)',
              border: '1px solid rgba(74, 222, 128, 0.5)',
              color: '#86efac',
              fontWeight: 600,
            }}
          >
            🎨 Lên Màu Cảnh
          </button>
          <button
            className="btn-editor-action"
            onClick={() => {
              onSaveLayout();
              handleAction('Đã lưu bố cục làng thành công!');
            }}`
);

// 4. Add "Lên Màu Núi / Đá" in floating editor selection bar
uiCode = uiCode.replace(
  `          <button
            className="editor-tool-btn danger"
            onClick={() => {
              onDeleteSelected();
              handleAction('Đã xóa vật thể khỏi cảnh!');
            }}`,
  `          <button
            className="editor-tool-btn"
            onClick={() => {
              onBlendSelectedColor?.();
              handleAction('Đã lên màu cỏ & đá tự nhiên cho vật thể!');
            }}
            title="Lên màu cỏ xanh cho bậc thang & đá cho vách núi"
            style={{
              background: 'linear-gradient(135deg, #15803d, #16a34a)',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            🎨 Lên Màu
          </button>
          <button
            className="editor-tool-btn danger"
            onClick={() => {
              onDeleteSelected();
              handleAction('Đã xóa vật thể khỏi cảnh!');
            }}`
);

fs.writeFileSync(uiPath, uiCode, 'utf8');
console.log('src/components/ui/GameUI.tsx patched successfully!');
