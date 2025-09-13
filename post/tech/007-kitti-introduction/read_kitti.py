import numpy as np
import open3d as o3d
import argparse
import os

def read_kitti_bin(bin_path):
    """
    Reads a .bin file from KITTI dataset and returns a numpy array.
    Each point is (x, y, z, reflectance).
    """
    if not os.path.exists(bin_path):
        raise FileNotFoundError(f"File not found: {bin_path}")
    
    point_cloud = np.fromfile(bin_path, dtype=np.float32).reshape(-1, 4)
    return point_cloud

def visualize_point_cloud(points):
    """
    Visualizes point cloud using Open3D.
    `points` should be a (N, 3) numpy array.
    """
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)

    # Optionally set color (e.g., white)
    pcd.paint_uniform_color([1, 1, 1])

    o3d.visualization.draw_geometries([pcd])

def main(config):
    # Read point cloud from the .bin file
    point_cloud = read_kitti_bin(config.input_path)

    # We only need (x, y, z) for visualization, not reflectance
    xyz_points = point_cloud[:, :3]

    # Visualize
    visualize_point_cloud(xyz_points)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Visualize KITTI point cloud using Open3D")
    parser.add_argument('--input_path', type=str, required=True, help="Path to the KITTI .bin file")

    config = parser.parse_args()
    main(config)
