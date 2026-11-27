#include <cuda_runtime.h>  // CUDA Runtime API, including device queries and error codes.
#include <cstdio>          // C++ standard header for printf, which formats console output.

int main() {
    // This program runs on the host (CPU). It queries the GPU without launching a kernel.
    cudaDeviceProp prop;
    // Device 0 is the first GPU visible to the CUDA application. On success, CUDA
    // writes its properties into prop through the pointer &prop.
    cudaError_t err = cudaGetDeviceProperties(&prop, 0);

    // Check the status before reading prop. cudaGetErrorString turns a CUDA
    // error code into readable text, and returning 1 signals failure to the shell.
    if (err != cudaSuccess) {
        printf("Failed to get device properties: %s\n", cudaGetErrorString(err));
        return 1;
    }

    // Compute capability is the GPU's CUDA architecture version, written as
    // major.minor. It determines which CUDA hardware features are supported.
    printf("Device name: %s\n", prop.name);
    printf("Compute capability: %d.%d\n", prop.major, prop.minor);
    // An SM (streaming multiprocessor) runs thread blocks. A block's threads
    // are grouped into warps, which are the units the SM schedules.
    printf("SM count: %d\n", prop.multiProcessorCount);
    printf("Warp size: %d\n", prop.warpSize);
    // The block limit applies to a single block. The SM limit counts resident
    // threads across all blocks on one SM. Registers and shared memory used by
    // each block can reduce the number of blocks that fit on an SM at once.
    printf("Max threads per block: %d\n", prop.maxThreadsPerBlock);
    printf("Max threads per SM: %d\n", prop.maxThreadsPerMultiProcessor);
    printf("Registers per SM: %d\n", prop.regsPerMultiprocessor);
    printf("Shared memory per SM: %.2f KiB\n", prop.sharedMemPerMultiprocessor / 1024.0);
    // Memory capacities are reported in bytes. Dividing by powers of 1024
    // converts them to KiB (above), MiB, or GiB for display.
    // L2 is a cache shared across SMs. Global memory is the GPU's main memory,
    // and the bus width gives the number of bits in its memory interface.
    printf("L2 cache: %.2f MiB\n", prop.l2CacheSize / 1048576.0);
    printf("Global memory: %.2f GiB\n", prop.totalGlobalMem / 1073741824.0);
    printf("Memory bus width: %d bits\n", prop.memoryBusWidth);

    return 0;
}
