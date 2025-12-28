import os
import argparse
from PIL import Image, ImageDraw, ImageChops

def get_content_bbox(img, threshold=250):
    """
    检测图片中的内容区域（非白色背景）。
    返回 (left, top, right, bottom)
    """
    # 转换为灰度图
    gray = img.convert('L')
    
    # 二值化：将接近白色的像素设为 255 (背景)，其他设为 0 (内容)
    # 注意：ImageChops.difference 会计算 abs(a - b)
    # 我们想要找与白色 (255) 差异大的区域
    
    # 创建一个纯白图像用于对比
    bg = Image.new('L', img.size, 255)
    
    # 计算差异：白色区域差异为0 (黑)，非白区域差异>0
    diff = ImageChops.difference(gray, bg)
    
    # 增加一点容差，过滤噪点
    # point 操作：如果差异 < (255 - threshold)，设为0，否则设为255
    # threshold 越小，容忍度越高（越接近白色的也会被当做内容）
    # threshold=250 意味着只有非常接近 255 的才会被当做背景
    tolerance = 255 - threshold
    diff = diff.point(lambda x: 255 if x > tolerance else 0)
    
    # 获取非零区域的边界框
    return diff.getbbox()

def crop_smart_circle(img, target_size=(256, 256)):
    """
    智能裁剪：
    1. 检测内容 Bounding Box
    2. 以 BBox 中心为圆心
    3. 以 BBox 最大边长为直径
    4. 裁剪并缩放到 target_size
    5. 应用圆形抗锯齿遮罩
    """
    img = img.convert("RGBA")
    
    # 1. 检测内容
    bbox = get_content_bbox(img)
    
    if not bbox:
        # print("  警告: 未检测到内容，使用默认中心裁剪")
        w, h = img.size
        cx, cy = w // 2, h // 2
        diameter = min(w, h)
    else:
        left, top, right, bottom = bbox
        content_w = right - left
        content_h = bottom - top
        
        # 计算中心
        cx = left + content_w // 2
        cy = top + content_h // 2
        
        # 确定直径：取宽高的最大值，并稍微加一点 padding 避免切边
        diameter = max(content_w, content_h)
        # 保持 1:1 比例，diameter 就是正方形边长
    
    # 2. 计算裁剪坐标 (源图像中的坐标)
    # 以 (cx, cy) 为中心，diameter 为边长
    half_d = diameter // 2
    src_left = cx - half_d
    src_top = cy - half_d
    src_right = src_left + diameter
    src_bottom = src_top + diameter
    
    # 执行裁剪 (crop 会自动处理超出边界的情况，用透明/黑色填充，但我们需要保持白色背景以便后续处理)
    # 更好的方式是先扩展画布或计算有效区域。
    # 这里简单起见，使用 crop，它对于超出部分可能不会自动填充白色。
    # 我们可以先 crop，然后把结果贴到一个新的透明/白色底图上。
    
    cropped_square = img.crop((src_left, src_top, src_right, src_bottom))
    
    # 3. 缩放到目标尺寸 (高质量)
    resized_square = cropped_square.resize(target_size, Image.Resampling.LANCZOS)
    
    # 4. 生成圆形遮罩
    mask = Image.new('L', target_size, 0)
    draw = ImageDraw.Draw(mask)
    
    # 抗锯齿绘制：画大图然后缩小，或者直接画
    # 这里使用 4x 超采样
    scale = 4
    big_size = (target_size[0] * scale, target_size[1] * scale)
    big_mask = Image.new('L', big_size, 0)
    big_draw = ImageDraw.Draw(big_mask)
    big_draw.ellipse((0, 0, big_size[0], big_size[1]), fill=255)
    mask = big_mask.resize(target_size, Image.Resampling.LANCZOS)
    
    # 5. 应用遮罩
    # 确保 resized_square 是 RGBA
    if resized_square.mode != 'RGBA':
        resized_square = resized_square.convert('RGBA')
        
    resized_square.putalpha(mask)
    
    return resized_square

def main():
    parser = argparse.ArgumentParser(description='将网格图片裁剪为圆形头像')
    parser.add_argument('--input', '-i', default='avatars_grid.png', help='输入图片路径')
    parser.add_argument('--output', '-o', default='public/circles', help='输出目录')
    parser.add_argument('--rows', type=int, default=4, help='行数')
    parser.add_argument('--cols', type=int, default=4, help='列数')
    
    args = parser.parse_args()
    
    INPUT_FILE = args.input
    OUTPUT_DIR = args.output
    ROWS = args.rows
    COLS = args.cols
    
    if not os.path.exists(INPUT_FILE):
        print(f"错误: 找不到文件 '{INPUT_FILE}'")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    try:
        img = Image.open(INPUT_FILE)
        width, height = img.size
        cell_width = width // COLS
        cell_height = height // ROWS
        
        print(f"处理文件: {INPUT_FILE}")
        print(f"图片尺寸: {width}x{height}")
        print(f"输出目录: {OUTPUT_DIR}")
        print("开始智能裁剪...")
        
        count = 0
        for row in range(ROWS):
            for col in range(COLS):
                count += 1
                
                # 粗略分割网格
                left = col * cell_width
                upper = row * cell_height
                right = left + cell_width
                lower = upper + cell_height
                
                cell_img = img.crop((left, upper, right, lower))
                
                # 智能处理
                # print(f"处理第 {count} 张...", end="", flush=True)
                final_img = crop_smart_circle(cell_img)
                # print(" 完成")
                
                filename = f"circle_{count:02d}.png"
                final_img.save(os.path.join(OUTPUT_DIR, filename))
                print(f"已生成: {filename}")
                
        print(f"\n全部完成！输出目录: {OUTPUT_DIR}")
        
    except Exception as e:
        print(f"\n发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
