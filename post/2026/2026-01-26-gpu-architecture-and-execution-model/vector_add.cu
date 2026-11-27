#include <cuda_runtime.h>  // CUDA memory, device, event, and occupancy APIs.
#include <cstdio>          // printf, fprintf, and stderr for console output.
#include <cstdlib>         // atoi for parsing a block size, plus exit and EXIT_FAILURE.
#include <vector>          // std::vector owns the arrays in host memory.
#include <cmath>           // std::fabs computes the absolute error.

// Run a CUDA API call once and exit on failure. __FILE__ and __LINE__ identify
// the call site. The do/while wrapper lets CHECK behave like one statement.
#define CHECK(call) do {                              \
    cudaError_t err = (call);                         \
    if (err != cudaSuccess) {                         \
        fprintf(stderr, "%s:%d: %s\n",                \
                __FILE__, __LINE__,                   \
                cudaGetErrorString(err));             \
        exit(EXIT_FAILURE);                           \
    }                                                 \
} while (0)

// __global__ marks a kernel that the host launches and GPU threads execute.
// a, b, and c point to device memory.
__global__ void vectorAdd(
    const float* a,
    const float* b,
    float* c,
    int n)
{
    // A block starts at blockIdx.x * blockDim.x. threadIdx.x is this thread's
    // offset within that block, so each thread gets a different array index.
    int i = blockIdx.x * blockDim.x + threadIdx.x;

    // Rounding up the grid size can leave extra threads in the final block.
    if (i < n)
        c[i] = a[i] + b[i];
}


int main(int argc, char** argv) {
    // 1 << 24 is 2^24 elements. CUDA allocation and copy sizes are in bytes.
    const int N = 1 << 24;
    const size_t bytes = N * sizeof(float);
    const int iterations = 100;

    // Reuse one CPU array of ones to initialize both GPU input arrays.
    std::vector<float> h(N, 1.0f);
    std::vector<float> result(N);

    float *a, *b, *c;

    // cudaMalloc writes a device pointer through its first argument.
    CHECK(cudaMalloc(&a, bytes));
    CHECK(cudaMalloc(&b, bytes));
    CHECK(cudaMalloc(&c, bytes));

    // cudaMemcpy takes the destination first. data() exposes the vector's
    // contiguous CPU buffer for the host-to-device copy.
    CHECK(cudaMemcpy(a, h.data(), bytes,
                     cudaMemcpyHostToDevice));

    CHECK(cudaMemcpy(b, h.data(), bytes,
                     cudaMemcpyHostToDevice));

    // Query CUDA device 0 for its block and SM thread limits.
    cudaDeviceProp prop;
    CHECK(cudaGetDeviceProperties(&prop, 0));

    // CUDA events mark points in a stream and can measure elapsed GPU time.
    cudaEvent_t start, stop;
    CHECK(cudaEventCreate(&start));
    CHECK(cudaEventCreate(&stop));

    int blockSizes[] = {32, 64, 128, 256, 512, 1024};

    printf("Block  Grid      Time(ms)  GB/s     GFLOPS  Occ(%%)\n");

    for (int block : blockSizes) {
        // An optional command-line argument selects one block size to test.
        if (argc > 1 && block != atoi(argv[1]))
            continue;

        if (block > prop.maxThreadsPerBlock)
            continue;

        // Round up so the grid covers all N elements.
        int grid = (N + block - 1) / block;

        // Warm up before timing. <<<grid, block>>> sets the number of blocks
        // and the number of threads per block in this one-dimensional launch.
        for (int i = 0; i < 10; ++i)
            vectorAdd<<<grid, block>>>(a, b, c, N);

        // Check for launch errors, then wait for GPU work and check for
        // execution errors before starting the timer.
        CHECK(cudaGetLastError());
        CHECK(cudaDeviceSynchronize());

        // The events and kernels are queued in order in the default stream.
        // The stop event completes after the last kernel. The measured
        // interval excludes the warm-up and host-device copies.
        CHECK(cudaEventRecord(start));

        for (int i = 0; i < iterations; ++i)
            vectorAdd<<<grid, block>>>(a, b, c, N);

        CHECK(cudaGetLastError());
        CHECK(cudaEventRecord(stop));
        CHECK(cudaEventSynchronize(stop));

        float elapsed;
        CHECK(cudaEventElapsedTime(&elapsed, start, stop));

        // The event API reports milliseconds for the whole batch.
        float ms = elapsed / iterations;
        double seconds = ms / 1000.0;

        // Effective bandwidth counts two input reads and one output write
        // per element. Actual traffic to GPU main memory can differ.
        double bandwidth =
            (3.0 * bytes) / seconds / 1e9;

        // Each element performs one floating-point addition.
        double gflops = N / seconds / 1e9;

        // Estimate how many blocks of this kernel can reside on one SM at
        // once. The last argument is dynamic shared memory per block in bytes.
        int activeBlocks;

        CHECK(cudaOccupancyMaxActiveBlocksPerMultiprocessor(
            &activeBlocks, vectorAdd, block, 0));

        // Convert resident blocks to resident threads and divide by the SM's
        // thread capacity. This is theoretical occupancy.
        double occupancy =
            100.0 * activeBlocks * block /
            prop.maxThreadsPerMultiProcessor;

        // Copy the output back to CPU memory and check it against 1.0 + 1.0.
        CHECK(cudaMemcpy(result.data(), c, bytes,
                         cudaMemcpyDeviceToHost));

        for (int i = 0; i < N; ++i) {
            if (std::fabs(result[i] - 2.0f) > 1e-6f) {
                fprintf(stderr, "Incorrect result at %d\n", i);
                return 1;
            }
        }

        printf("%5d  %7d  %8.4f  %7.2f  %7.2f  %6.1f\n",
               block, grid, ms, bandwidth,
               gflops, occupancy);
    }

    // Release the CUDA events and device allocations when the benchmark ends.
    CHECK(cudaEventDestroy(start));
    CHECK(cudaEventDestroy(stop));

    CHECK(cudaFree(a));
    CHECK(cudaFree(b));
    CHECK(cudaFree(c));

    return 0;
}
