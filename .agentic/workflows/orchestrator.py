"""
Eksporflow Multi-Agent Orchestration Workflow Runner
This script defines a programmatic workflow pipeline for Eksporflow feature development.
"""

import sys
import subprocess
import json

def run_step(cmd_list, description):
    print(f"\n[ORCHESTRATOR] === {description} ===")
    res = subprocess.run(cmd_list, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print(f"[ORCHESTRATOR ERROR] Step failed with code {res.returncode}:")
        print(res.stderr or res.stdout)
        return False
    print(f"[ORCHESTRATOR SUCCESS] {description} completed cleanly.")
    return True

def verify_all():
    print("[ORCHESTRATOR] Initiating comprehensive quality gate verification...")
    
    # 1. Type check
    if not run_step(["node", "node_modules\\typescript\\bin\\tsc", "--noEmit"], "TypeScript Compilation Check"):
        return False
        
    # 2. Test suite
    if not run_step(["node", "node_modules\\vitest\\vitest.mjs", "run"], "Vitest Test Suite Execution"):
        return False
        
    # 3. Client bundle build
    if not run_step(["node", "node_modules\\vite\\bin\\vite.js", "build"], "Vite Client Production Build"):
        return False
        
    # 4. Server bundle build
    if not run_step([
        "node", "node_modules\\esbuild\\bin\\esbuild", 
        "server/_core/index.ts", "--platform=node", 
        "--packages=external", "--bundle", "--format=esm", 
        "--outdir=dist"
    ], "Server esbuild Bundle Build"):
        return False
        
    print("\n[ORCHESTRATOR] All quality gates passed 100%! Ready for atomic commit.")
    return True

if __name__ == "__main__":
    success = verify_all()
    sys.exit(0 if success else 1)
