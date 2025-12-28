import os
import sys

try:
    from PIL import Image, ImageDraw, ImageOps
except ImportError:
    print("需要安装 Pillow 库才能运行此脚本。")
    print("请运行: pip install Pillow")
    sys.exit(1)

def crop_to_circle(img):
    """
    将图片裁剪为圆形，背景透明，边缘抗锯齿。
    原理：创建一个 4 倍大小的遮罩进行绘制，然后缩小以获得平滑边缘。
    """
    # 转换为 RGBA 确保支持透明度
    img = img.convert("RGBA")
    w, h = img.size
    
    # 取最小边作为直径
    diameter = min(w, h)
    
    # 计算居中裁剪区域
    left = (w - diameter) // 2
    top = (h - diameter) // 2
    right = left + diameter
    bottom = top + diameter
    
    # 先裁剪成正方形
    img = img.crop((left, top, right, bottom))
    
    # 创建 4 倍大小的遮罩以实现抗锯齿
    mask_scale = 4
    mask_size = (diameter * mask_scale, diameter * mask_scale)
    mask = Image.new('L', mask_size, 0)
    draw = ImageDraw.Draw(mask)
    
    # 绘制白色圆形
    draw.ellipse((0, 0, mask_size[0], mask_size[1]), fill=255)
    
    # 缩小遮罩回原尺寸 (使用 LANCZOS 进行高质量重采样)
    mask = mask.resize((diameter, diameter), Image.Resampling.LANCZOS)
    
    # 应用遮罩
    img.putalpha(mask)
    
    return img

def generate_comparison_html(output_dir, items):
    """
    生成 HTML 对比报告
    """
    html_content = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>头像裁剪效果对比</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; background: #f8fafc; color: #334155; }
        h1 { text-align: center; margin-bottom: 40px; color: #0f172a; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
        .card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .comparison { display: flex; gap: 20px; justify-content: center; align-items: center; }
        .img-box { text-align: center; }
        .img-box img { width: 100px; height: 100px; border-radius: 8px; }
        .img-box.circle img { background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }
        .label { display: block; margin-top: 10px; font-size: 12px; font-weight: bold; color: #64748b; }
        .arrow { color: #cbd5e1; font-size: 24px; }
    </style>
</head>
<body>
    <h1>🎨 头像裁剪效果对比</h1>
    <div class="grid">
"""
    
    for item in items:
        html_content += f"""
        <div class="card">
            <div class="comparison">
                <div class="img-box">
                    <img src="{item['square']}" alt="Original">
                    <span class="label">原图裁剪</span>
                </div>
                <div class="arrow">➜</div>
                <div class="img-box circle">
                    <img src="{item['circle']}" alt="Processed">
                    <span class="label">圆形优化</span>
                </div>
            </div>
        </div>
"""
    
    html_content += """
    </div>
</body>
</html>
"""
    
    html_path = os.path.join(output_dir, 'comparison.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"\n✨ 对比报告已生成: {html_path}")
    print("提示: 您可以直接在浏览器中打开此文件查看效果。")

def process_avatars():
    # 配置
    INPUT_FILE = 'avatars_grid.png'
    OUTPUT_DIR = 'public/avatars'
    ROWS = 4
    COLS = 4
    
    # 要移除的索引 (1-based, 对应 4x4 网格)
    # 1: Mountain, 4: Tent, 8: Tent Night, 14: Forest, 16: Mountain2
    REMOVE_INDICES = {1, 4, 8, 14, 16}

    if not os.path.exists(INPUT_FILE):
        print(f"错误: 找不到文件 '{INPUT_FILE}'")
        print(f"请将头像网格图片保存为 '{INPUT_FILE}' 并放置在项目根目录下。")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"创建目录: {OUTPUT_DIR}")

    try:
        img = Image.open(INPUT_FILE)
        width, height = img.size
        cell_width = width // COLS
        cell_height = height // ROWS
        
        print(f"图片尺寸: {width}x{height}")
        print(f"单个头像尺寸: {cell_width}x{cell_height}")
        
        count = 0
        saved_count = 0
        processed_items = []
        
        for row in range(ROWS):
            for col in range(COLS):
                count += 1
                if count in REMOVE_INDICES:
                    # print(f"跳过第 {count} 个头像")
                    continue
                
                # 计算裁剪区域
                left = col * cell_width
                upper = row * cell_height
                right = left + cell_width
                lower = upper + cell_height
                
                # 1. 获取原始方图
                square_img = img.crop((left, upper, right, lower))
                
                # 2. 生成圆形图
                circle_img = crop_to_circle(square_img)
                
                saved_count += 1
                
                # 保存方图 (仅用于对比)
                square_filename = f"avatar_{saved_count:02d}_square.png"
                square_img.save(os.path.join(OUTPUT_DIR, square_filename))
                
                # 保存圆图 (最终使用)
                circle_filename = f"avatar_{saved_count:02d}.png"
                circle_img.save(os.path.join(OUTPUT_DIR, circle_filename))
                
                processed_items.append({
                    'square': square_filename,
                    'circle': circle_filename
                })
                
                print(f"处理第 {saved_count} 个头像... OK")
                
        # 生成对比报告
        generate_comparison_html(OUTPUT_DIR, processed_items)
        print(f"\n全部完成! 共处理 {saved_count} 个头像。")
        
    except Exception as e:
        print(f"发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    process_avatars()
