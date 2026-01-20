<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	const session = authClient.useSession();
	const callbackURL = $page.url.searchParams.get('callbackURL') || '/';

	// If already logged in, redirect to callback URL
	$effect(() => {
		if ($session.data) {
			goto(callbackURL);
		}
	});

	async function signInWithGoogle() {
		try {
			await authClient.signIn.social({
				provider: 'google',
				callbackURL
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			toast.error(`Error signing in with Google: ${errorMessage}`);
		}
	}
</script>

<div class="container mx-auto max-w-md px-4 py-16">
	<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-8">
		<h1 class="mb-2 text-2xl font-bold">Sign In</h1>
		<p class="mb-6 text-muted-foreground">Sign in to continue to Office Lunch Management</p>

		<Button class="w-full cursor-pointer" onclick={signInWithGoogle}>Continue with Google</Button>

		<div class="mt-6 text-center">
			<a href="/" class="text-sm text-muted-foreground hover:underline">← Back to Home</a>
		</div>
	</div>
</div>
