import fs from 'fs';
import path from 'path';

const INPUT_FILE = 'D:\\PhuGiaCat\\src\\.claude\\skills\\import-products-by-sku\\tmp\\base-by-sheet\\cam-ip-batch8.json';
const OUTPUT_FILE = 'D:\\PhuGiaCat\\src\\.claude\\skills\\import-products-by-sku\\tmp\\enriched-by-sheet\\cam-ip-batch8.json';

// Ensure output dir exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

// Helper: normalize category - remove trailing brand/generic terms
function normalizeCategory(categoryPath) {
  if (!Array.isArray(categoryPath) || categoryPath.length === 0) {
    return ['Camera'];
  }

  const path = [...categoryPath];
  const lastItem = path[path.length - 1];

  // Remove if it's brand name, "Chưa xác định", or exact repeat of previous
  if (
    lastItem === 'HIKVISION' ||
    lastItem === 'Hikvision' ||
    lastItem === 'Camera Hikvision' ||
    lastItem === 'Chưa xác định' ||
    (path.length > 1 && lastItem === path[path.length - 2])
  ) {
    path.pop();
  }

  return path.length > 0 ? path : ['Camera'];
}

// Helper: extract key specs from sourceMatches
function aggregateSpecs(sourceMatches, extraFields) {
  const specs = {};

  // From sourceMatches
  if (Array.isArray(sourceMatches)) {
    sourceMatches.forEach(match => {
      if (Array.isArray(match.specifications)) {
        match.specifications.forEach(spec => {
          const label = spec.label?.trim();
          const value = spec.value?.trim();
          if (label && value && !specs[label]) {
            specs[label] = value;
          }
        });
      }
    });
  }

  // From extraFields (usually "Thông số kỹ thuật")
  if (Array.isArray(extraFields)) {
    extraFields.forEach(field => {
      if (field.label === 'Thông số kỹ thuật' && field.value) {
        // Extract key-value pairs from the text
        const lines = field.value.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('+') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
            // Skip - these are bullet items, not structured key-value
            return;
          }
        });
      }
    });
  }

  return specs;
}

// Helper: build sorted, deduplicated specs array
function buildSpecsArray(sourceMatches, extraFields, warrantyText) {
  const specsMap = aggregateSpecs(sourceMatches, extraFields);

  // Key specs to prioritize (in order)
  const priorityLabels = [
    'Cảm biến hình ảnh',
    'Độ phân giải tối đa',
    'Độ phân giải',
    'Độ nhạy sáng',
    'Độ nhạy sáng tối thiểu',
    'Ống kính',
    'Zoom',
    'Zoom quang học',
    'Zoom số',
    'Hỗ trợ Zoom',
    'Chống ngược sáng (WDR)',
    'Chống ngược sáng',
    'Hồng ngoại',
    'Hỗ trợ ánh sánh',
    'Tầm quan sát',
    'PTZ',
    'Xoay & Nghiêng',
    'Xoay & Quét',
    'Preset',
    'Chuẩn nén',
    'Chuẩn nén video',
    'Chuẩn nén hình ảnh',
    'Lưu trữ',
    'Tích hợp Microphone',
    'Audio',
    'Ngõ vào/ra Audio',
    'Tích hợp loa',
    'Kết nối wifi',
    'Mạng & Kết nối',
    'Cổng mạng',
    'Giao diện mạng',
    'Nguồn điện',
    'Nguồn cấp',
    'Chuẩn bảo vệ',
    'Tiêu chuẩn bảo vệ',
    'Chống bụi, nước',
    'Chống chịu môi trường',
    'Tính năng hình ảnh',
    'Sự kiện thông minh',
    'Tính năng',
    'Tính năng, hỗ trợ',
  ];

  const result = [];

  // Add prioritized specs
  priorityLabels.forEach(label => {
    if (specsMap[label]) {
      result.push({
        label: label,
        value: specsMap[label]
      });
      delete specsMap[label];
    }
  });

  // Add remaining specs
  Object.keys(specsMap).forEach(label => {
    result.push({
      label: label,
      value: specsMap[label]
    });
  });

  // Add warranty if present
  if (warrantyText) {
    result.push({
      label: 'Bảo hành',
      value: warrantyText
    });
  }

  return result;
}

// Helper: check if item is accessory
function isAccessory(item, sourceMatches) {
  if (Array.isArray(sourceMatches) && sourceMatches.length > 0) {
    const title = sourceMatches[0].title || '';
    if (title.includes('Bàn điều khiển') || title.includes('phụ kiện') || title.includes('nguồn') || title.includes('adapter')) {
      return true;
    }
  }

  const categoryLast = item.categoryPath?.[item.categoryPath.length - 1] || '';
  if (categoryLast.includes('Bàn điều khiển') || categoryLast.includes('Phụ kiện') || categoryLast.includes('Nguồn')) {
    return true;
  }

  return false;
}

// Helper: generate title
function generateTitle(item, sourceMatches) {
  const sku = item.sku || 'Camera';

  // Check if accessory
  if (isAccessory(item, sourceMatches)) {
    const specs = aggregateSpecs(sourceMatches, item.extraFields);
    const category = item.categoryPath?.[item.categoryPath.length - 1] || 'Phụ kiện';
    return `${category} Hikvision ${sku}`;
  }

  // Clean SKU for model (remove /W, /G, etc. suffixes)
  let model = sku.split('/')[0];

  // Try to get resolution from source
  let resolution = '2-4MP';
  if (Array.isArray(sourceMatches) && sourceMatches.length > 0) {
    const specs = sourceMatches[0].specifications || [];
    const resSpec = specs.find(s => s.label === 'Độ phân giải' || s.label === 'Độ phân giải tối đa');
    if (resSpec) {
      const val = resSpec.value || '';
      if (val.includes('4MP') || val.includes('4.0')) resolution = '4MP';
      else if (val.includes('2MP') || val.includes('2.0')) resolution = '2MP';
      else if (val.includes('5MP') || val.includes('5.0')) resolution = '5MP';
    }

    const title = sourceMatches[0].title || '';
    if (title.includes('Speed Dome')) {
      return `Camera IP Speed Dome ${resolution} Hikvision ${model}`;
    }
  }

  // Fallback
  return `Camera IP ${resolution} Hikvision ${model}`;
}

// Helper: generate short description bullets
function generateShortDesc(item, sourceMatches) {
  const specs = aggregateSpecs(sourceMatches, item.extraFields);
  const bullets = [];

  // Check if accessory
  if (isAccessory(item, sourceMatches)) {
    const joystick = specs['Joystick'] || '';
    const connection = specs['Kết nối'] || '';
    const compatible = specs['Tương thích'] || '';
    const power = specs['Nguồn cấp'] || '';

    if (joystick) bullets.push(`Joystick ${joystick.match(/\d/)?.[0] || 3}-trục`);
    if (connection.includes('USB')) bullets.push('Kết nối USB');
    if (connection.includes('Network') || connection.includes('RJ45')) bullets.push('Kết nối mạng');
    if (power) bullets.push(power);
    if (compatible) {
      const apps = compatible.match(/(iVMS|NVR|DVR)/)?.[0] || 'phần mềm';
      bullets.push(`Tương thích ${apps}`);
    }

    return bullets.slice(0, 5);
  }

  // Camera short descriptions
  const resolution = specs['Độ phân giải tối đa'] || specs['Độ phân giải'] || '';
  if (resolution) {
    let mp = '';
    if (resolution.includes('4MP') || resolution.includes('4.0')) mp = '4MP';
    else if (resolution.includes('2MP') || resolution.includes('2.0')) mp = '2MP';
    else if (resolution.includes('5MP') || resolution.includes('5.0')) mp = '5MP';
    if (mp) bullets.push(`Độ phân giải ${mp}`);
  }

  const zoom = specs['Zoom'] || specs['Zoom quang học'] || specs['Hỗ trợ Zoom'] || '';
  if (zoom.includes('4') || zoom.includes('4x')) bullets.push('Zoom quang 4x');

  const ir = specs['Hỗ trợ ánh sánh'] || specs['Tầm quan sát'] || '';
  if (ir) {
    const dist = ir.match(/(\d+)\s*m/)?.[1];
    if (dist) bullets.push(`Hồng ngoại ${dist}m`);
  }

  const wdr = specs['Chống ngược sáng (WDR)'] || specs['Chống ngược sáng'] || '';
  if (wdr.includes('120')) bullets.push('WDR 120dB chống ngược sáng');

  const ip = specs['Chuẩn bảo vệ'] || specs['Tiêu chuẩn bảo vệ'] || specs['Chống chịu môi trường'] || '';
  if (ip.includes('IP66')) bullets.push('IP66 chống nước bụi');

  const wifi = specs['Kết nối wifi'] || specs['Mạng & Kết nối'] || '';
  if (wifi.includes('WiFi') || wifi.includes('Wifi')) bullets.push('Hỗ trợ WiFi');

  const ptz = specs['PTZ'] || specs['Xoay & Nghiêng'] || '';
  if (ptz.includes('330') || ptz.includes('355') || ptz.includes('350')) {
    bullets.push('PTZ xoay 360°');
  }

  const ai = specs['Sự kiện thông minh'] || specs['Tính năng hình ảnh'] || '';
  if (ai.includes('khuôn mặt') || ai.includes('Face')) bullets.push('Phát hiện khuôn mặt, xâm nhập');

  const storage = specs['Lưu trữ'] || specs['Hỗ trợ lưu trữ'] || '';
  if (storage.includes('256GB')) bullets.push('Thẻ nhớ lên 256GB');

  return bullets.slice(0, 5); // Max 5 bullets
}

// Helper: generate description
function generateDescription(item, sourceMatches) {
  const specs = aggregateSpecs(sourceMatches, item.extraFields);

  // Check if accessory
  if (isAccessory(item, sourceMatches)) {
    const joystick = specs['Joystick'] || '';
    const connection = specs['Kết nối'] || specs['Chức năng khác'] || '';
    const compatible = specs['Tương thích'] || '';
    const power = specs['Nguồn cấp'] || '5V DC';

    let desc = '';

    // Intro for accessory
    if (item.sku.includes('1005')) {
      desc += `Hikvision DS-1005KI là bàn điều khiển camera IP Speed Dome chuyên dụng, giúp điều khiển các camera PTZ một cách dễ dàng và linh hoạt. Thiết bị kết nối qua USB, tương thích với nhiều hệ thống giám sát chuyên nghiệp.`;
    } else {
      desc += `Hikvision ${item.sku} là bàn điều khiển camera IP Speed Dome cao cấp, cho phép điều khiển toàn diện các chức năng PTZ của camera. Thiết bị kết nối qua mạng, tương thích với các platform giám sát hiện đại.`;
    }
    desc += '\n\n';

    // Features
    desc += `${joystick ? `Trang bị ${joystick.toLowerCase()}, ` : ''}${connection ? `${connection.substring(0,1).toUpperCase()}${connection.substring(1).toLowerCase()}. ` : ''}${power ? `Nguồn cấp ${power.toLowerCase()}. ` : ''}`;
    if (compatible) {
      desc += `Tương thích với ${compatible.toLowerCase()}.`;
    }

    return desc;
  }

  // Camera description
  const resolution = specs['Độ phân giải tối đa'] || specs['Độ phân giải'] || '2-4MP';
  const sensor = specs['Cảm biến hình ảnh'] || 'CMOS';
  const zoom = specs['Zoom'] || 'zoom quang 4x';
  const ir = specs['Tầm quan sát'] || specs['Hỗ trợ ánh sánh'] || '20-50m';
  const ip = specs['Chuẩn bảo vệ'] || 'IP66';
  const wdr = specs['Chống ngược sáng (WDR)'] || '120dB';
  const ptz = specs['PTZ'] || specs['Xoay & Nghiêng'] || '';

  let desc = '';

  // Paragraph 1: intro
  desc += `Hikvision ${item.sku} là camera IP Speed Dome mini có khả năng xoay quét (PTZ) phù hợp cho giám sát ngoài trời và trong nhà. Thiết bị mang lại hình ảnh sắc nét, rõ ràng với khả năng zoom linh hoạt và tính năng nhận diện thông minh.`;
  desc += '\n\n';

  // Paragraph 2: tech features
  desc += `Camera được trang bị cảm biến ${sensor}, độ phân giải ${resolution.toLowerCase()}. Hỗ trợ zoom quang và zoom số, tầm quan sát hồng ngoại đạt ${ir}. Công nghệ WDR ${wdr} giúp cân bằng ánh sáng, 3D DNR giảm nhiễu, đảm bảo hình ảnh rõ nét cả ngày lẫn đêm.`;

  if (ptz.includes('300')) {
    desc += ` Camera hỗ trợ 300 vị trí Preset tự động, xoay ngang 330-355° và dọc 90°, cho phép giám sát phạm vi rộng với tốc độ cao.`;
  }

  desc += ` Tích hợp Microphone, hỗ trợ 2 chiều âm thanh. Hỗ trợ thẻ nhớ microSD lên đến 256GB để lưu trữ địa phương.`;
  desc += '\n\n';

  // Paragraph 3: deployment/protection
  desc += `Thiết bị đạt chuẩn ${ip} chống bụi nước, IK10 chống va đập, phù hợp lắp đặt ngoài trời, tại các khu vực công cộng như bãi xe, cửa hàng, văn phòng, khu công nghiệp. Hỗ trợ nguồn 12VDC và PoE, cho phép cấp điện linh hoạt. Cõi dịch vụ Hik-Connect hỗ trợ quản lý từ xa qua ứng dụng di động.`;

  return desc;
}

// Main processing
const enriched = data.map((item, idx) => {
  console.log(`Processing item ${idx + 1}/${data.length}: ${item.sku}`);

  return {
    sku: item.sku,
    title: generateTitle(item, item.sourceMatches),
    brandName: 'Hikvision',
    categoryPath: normalizeCategory(item.categoryPath),
    shortDescription: generateShortDesc(item, item.sourceMatches),
    description: generateDescription(item, item.sourceMatches),
    specifications: buildSpecsArray(item.sourceMatches, item.extraFields, item.warrantyText),
    priceInVND: item.priceInVND || null,
    inStock: item.inStock ?? true,
    imagePathFromExcel: item.imagePathFromExcel
  };
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enriched, null, 2), 'utf-8');
console.log(`\nDone! Processed ${enriched.length} items.`);
console.log(`Output: ${OUTPUT_FILE}`);
